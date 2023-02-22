import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import { unparse } from 'papaparse';
import { Readable } from 'stream';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

import { BaseTelegram } from '../../telegram/base.telegram';
import { ConsultsService } from '../../cash/services/consults.service';

import { Expense } from '../../cash/entities/expense.entity';
import { Income } from '../../cash/entities/income.entity';

import { Cash } from '../../cash/models/cash.model';
import { Summary } from '../../cash/models/summary.model';

import { getHyphenDate } from 'src/utils';
import { passwordButtons } from '../utils';

config();
const configService = new ConfigService();

// State Interface
interface State {
  password: string;
  cash: Cash;
  summary: Summary;
  data: Expense[] | Income[];
}

// Scene
@Wizard('dataWizardScene')
export class DataScene {
  private state;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly consultsService: ConsultsService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initData(@Ctx() ctx: Scenes.WizardContext) {
    // Init State
    this.state = ctx.wizard.state as State;
    this.state.data = [];

    const confirmButton = Markup.button.callback('✅ Confirm', 'password');
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const keyboard = Markup.inlineKeyboard([[confirmButton, cancelButton]]);

    await ctx.replyWithMarkdownV2('Get all data in a csv file?', keyboard);
  }

  @Action('password')
  async goToPassword(@Ctx() ctx) {
    this.state.password = '';

    const buttons = passwordButtons();
    const message = 'Type password:';

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  @Action(/key:.+/)
  async getNumber(@Ctx() ctx) {
    let password = this.state.password;
    const [, key] = ctx.callbackQuery['data'].split(':');

    if (key == 'del') {
      password = password.slice(0, -1);
    } else {
      password = password.concat(key);
    }

    if (Number(password) == configService.get('SECURITY_PASSWORD')) {
      ctx.editMessageText('Validating...');
      setTimeout(() => {
        ctx.wizard.next();
        ctx.wizard.steps[ctx.wizard.cursor](ctx);
      }, 1000);
    } else {
      this.state.password = password;
      const buttons = passwordButtons();
      const message = 'Type password:\n\n' + '*'.repeat(password.length);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  }

  @WizardStep(2)
  async getData(@Ctx() ctx) {
    try {
      // Filter
      this.state.summary = Summary.YEAR;
      this.state.cash = Cash.ALL;

      const { items } = await this.consultsService.getDetails(this.state);

      this.state.data = items.map((value) => {
        if (value instanceof Expense) {
          value['cash'] = Cash.EXPENSE;
        } else if (value instanceof Income) {
          value['cash'] = Cash.INCOME;
        }
        return value;
      });

      ctx.wizard.next();
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx, 'There was a database error');
      ctx.scene.leave();
    }
  }

  @WizardStep(3)
  async cvsFile(@Ctx() ctx: Scenes.WizardContext) {
    try {
      ctx.editMessageText('Loading data...');

      const keys = [
        'cash',
        'concept',
        'amount',
        'transactionDate',
        'timestamp',
        'username',
        'filename',
      ];
      const data = {
        fields: keys,
        data: this.state.data,
      };

      // csv data
      const csvData = unparse(data, {
        header: true,
        delimiter: ',',
        skipEmptyLines: 'greedy',
      });

      const csv = new Readable();
      csv.push(csvData);
      csv.push(null);

      // Message
      ctx.editMessageText('Unparsed data');

      // Send file
      const filename = 'data' + '-' + getHyphenDate() + '.csv';
      await ctx.sendDocument({
        source: csv,
        filename,
      });
      this.baseTelegram.completedSticker(ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx, 'There was an unparse error');
    } finally {
      ctx.scene.leave();
    }
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
