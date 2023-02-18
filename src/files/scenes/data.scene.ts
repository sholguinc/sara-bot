import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import { unparse } from 'papaparse';
import { Readable } from 'stream';

import { BaseTelegram } from '../../telegram/base.telegram';
import { ConsultsService } from '../../cash/services/consults.service';

import { Expense } from '../../cash/entities/expense.entity';
import { Income } from '../../cash/entities/income.entity';

import { Cash } from '../../cash/models/cash.model';
import { Summary } from '../../cash/models/summary.model';

import { getHyphenDate } from 'src/utils';

// State Interface
interface State {
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

    const confirmButton = Markup.button.callback('✅ Confirm', 'getData');
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const keyboard = Markup.inlineKeyboard([[confirmButton, cancelButton]]);

    await ctx.replyWithMarkdownV2('Get all data in a csv file?', keyboard);
  }

  @Action('getData')
  async getData(@Ctx() ctx) {
    try {
      // Filter
      this.state.summary = Summary.YEAR;
      this.state.cash = Cash.ALL;

      const { items } = await this.consultsService.getDetails(this.state);

      this.state.data = items;

      ctx.wizard.next();
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx, 'There was a database error');
      ctx.scene.leave();
    }
  }

  @WizardStep(2)
  async cvsFile(@Ctx() ctx: Scenes.WizardContext) {
    try {
      ctx.editMessageText('Loading...');

      const keys = [
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
