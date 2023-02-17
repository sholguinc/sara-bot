import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { IncomesService } from '../../cash/services/incomes.service';

import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { Income } from '../../cash/entities/income.entity';

import { chunkArray, escapeMessage, localString } from 'src/utils';
import { pageButtons } from '../../cash/utils';
import { PAGE_LIMIT } from '../../config/constants';

interface State {
  user: User;
  incomes: Income[];
  total: number;
  offset: number;
}

// Scene
@Wizard('usersWizardScene')
export class UsersScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly usersService: UsersService,
    private readonly incomesService: IncomesService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initUsers(@Ctx() ctx: Scenes.WizardContext) {
    // Init
    this.state = ctx.wizard.state as State;
    this.state = { offset: 0 } as State;

    let users: User[];
    try {
      users = await this.usersService.findActives();

      const usersArray = users.map((user) => {
        const name = user.username;
        return Markup.button.callback(name, `selectUser:${name}`);
      });

      const buttons = chunkArray(usersArray, 2);

      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
      buttons.push([cancelButton]);

      await ctx.replyWithMarkdownV2(
        'Select user to get information from it',
        Markup.inlineKeyboard(buttons),
      );
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  @Action(/selectUser:.+/)
  async getUser(@Ctx() ctx) {
    const [, username] = ctx.callbackQuery['data'].split(':');

    try {
      this.state.user = await this.usersService.findOneByName(username);
      await ctx.editMessageText('Loading...');

      ctx.wizard.next();
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  @WizardStep(2)
  async userIncomes(@Ctx() ctx) {
    try {
      const user = this.state.user;
      const { incomes, total } = await this.incomesService.findByUser(user);

      if (total == 0) {
        await this.noIncomes(ctx, user);
        ctx.scene.leave();
      } else if (total <= PAGE_LIMIT) {
        this.state.total = total;
        await this.returnIncomes(ctx, incomes, this.state);
        ctx.scene.leave();
      } else {
        this.state.incomes = incomes;
        this.state.total = total;

        ctx.wizard.next();
        ctx.wizard.steps[ctx.wizard.cursor](ctx);
      }
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  // -> Enter to pagination

  @WizardStep(3)
  async pagination(@Ctx() ctx: Scenes.WizardContext) {
    try {
      if (!ctx.message) {
        // content
        const state = this.state;

        // data
        const pageData = this.getPageData(state);

        // process message
        const header = this.userHeader(state.user);
        const dataMessage = this.getIncomesMessage(pageData, state);
        const contentMessage = header + '\n\n' + dataMessage;
        const escapedMessage = escapeMessage(contentMessage);
        const buttons = pageButtons();

        // send message
        await ctx.editMessageText(escapedMessage, {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: buttons,
          },
        });
      }
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  // Pagination actions
  @Action('prevPage')
  async prevPage(@Ctx() ctx) {
    let offset = this.state.offset;

    offset -= PAGE_LIMIT;

    if (0 <= offset) {
      this.state.offset = offset;

      ctx.wizard.selectStep(2);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('nextPage')
  async nextPage(@Ctx() ctx) {
    let offset = this.state.offset;

    offset += PAGE_LIMIT;

    if (offset < this.state.total) {
      this.state.offset = offset;

      ctx.wizard.selectStep(2);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('finishPage')
  async cancelPage(@Ctx() ctx: Scenes.WizardContext) {
    ctx.editMessageText('Finished');
    ctx.scene.leave();
  }

  // No expenses function
  async noIncomes(ctx, user: User) {
    // Message
    const header = this.userHeader(user);
    const message = header + '\n\n' + 'User has no income';

    // Send Message
    const escapedMessage = escapeMessage(message);
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  // return expenses
  async returnIncomes(ctx, incomes: Income[], state: State) {
    // Message
    const header = this.userHeader(state.user);
    const dataMessage = this.getIncomesMessage(incomes, state);
    const contentMessage = header + '\n\n' + dataMessage;
    const escapedMessage = escapeMessage(contentMessage);

    // Send Message
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  getIncomesMessage(incomes: Income[], state: State) {
    // Page info
    const offset = state.offset;
    const total = state.total;
    const lowerLimit = Math.max(offset + 1, 1);
    const upperLimit = Math.min(offset + PAGE_LIMIT, total);
    const page = `${lowerLimit}-${upperLimit} of ${total}`;

    const subtitle = `_*User income (${page}):*_`;

    const items = incomes.map((income) => {
      // Information
      const date = localString(income.transactionDate);
      const amount = Number(income.amount).toFixed(2);

      return date + ' -> ' + 'S/.' + amount;
    });

    return subtitle + '\n' + items.join('\n');
  }

  userHeader(user: User) {
    const title = `_*User Info:*_`;

    const name = '- name: ' + user.username;
    const role = '- role: ' + user.role;
    const active = '- active: ' + user.active;

    const userInfo = name + '\n' + role + '\n' + active;

    return title + '\n' + userInfo;
  }

  // get Data
  getPageData(state: State): Income[] {
    return state.incomes.slice(state.offset, state.offset + PAGE_LIMIT);
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
