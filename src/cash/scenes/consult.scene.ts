import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { PAGE_LIMIT } from '../../config/constants';

import { Cash } from '../models/cash.model';
import { Type } from '../models/type.model';
import { Summary } from '../models/summary.model';

import { Income } from '../entities/income.entity';
import { Expense } from '../entities/expense.entity';

import { chunkArray, escapeMessage } from 'src/utils';
import { cashButtons, pageButtons, summaryButtons, typeButtons } from '../utils';
import { ConsultsService } from '../services/consults.service';
import { readFileSync } from 'fs';

// data interface
interface Data {
  offset: number;
  total: number;
  items: Expense[] | Income[];
}

// State Interface
interface State {
  type: Type;
  cash: Cash;
  summary: Summary;
  data: Data;
}

// Scene
@Wizard('consultWizardScene')
export class ConsultScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly consultsService: ConsultsService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initSend(@Ctx() ctx: Scenes.WizardContext) {
    // Init State
    this.state = ctx.wizard.state as State;
    this.state.data = { offset: 0 } as Data;

    const buttonArray = summaryButtons();
    const buttons = chunkArray(buttonArray, 2);

    await ctx.replyWithMarkdownV2(
      'Choose a type of consult:',
      Markup.inlineKeyboard(buttons),
    );
  }

  // -> User select summary period

  @Action(/summary:.+/)
  async chooseConsult(@Ctx() ctx: Scenes.WizardContext) {
    // Summary Period
    const [, summary] = ctx.callbackQuery['data'].split(':');
    this.state.summary = summary;

    const buttons = typeButtons();

    await ctx.editMessageText(
      'Choose a type of consult:',
      Markup.inlineKeyboard(buttons),
    );
  }

  // -> User select summary type

  @Action(/type:.+/)
  async consultType(@Ctx() ctx: Scenes.WizardContext) {
    // Type
    const [, type] = ctx.callbackQuery['data'].split(':');
    this.state.type = type;

    if (type == Type.DETAILS) {
      const buttons = cashButtons();
      await ctx.editMessageText(
        'Choose a type of consult:',
        Markup.inlineKeyboard(buttons),
      );
    } else if (type == Type.OVERALL) {
      await ctx.editMessageText('Loading...');
      await this.returnOverall(ctx);
    }
  }

  // -> User select cash type

  @Action(/cash:.+/)
  async cashType(@Ctx() ctx) {
    // Type
    const [, cash] = ctx.callbackQuery['data'].split(':');
    this.state.cash = cash;

    await ctx.editMessageText('Loading...');

    ctx.wizard.next();
    ctx.wizard.steps[ctx.wizard.cursor](ctx);
  }

  @WizardStep(2)
  async getDetailsData(@Ctx() ctx) {
    try {
      const { items, total } = await this.consultsService.getDetails(
        this.state,
      );

      if (total == 0) {
        await this.noItems(ctx, this.state);
        ctx.scene.leave();
      } else if (total <= PAGE_LIMIT) {
        this.state.data.total = total;
        await this.returnItems(ctx, items, this.state);
        ctx.scene.leave();
      } else {
        this.state.data.items = items;
        this.state.data.total = total;

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
  async detailsPagination(@Ctx() ctx: Scenes.WizardContext) {
    try {
      if (!ctx.message) {
        // data
        const pageData = this.getPageData(this.state.data);

        // process message
        const detailsMessage = this.consultsService.detailsMessage(
          pageData,
          this.state.data,
          this.state.summary,
          this.state.cash,
        );
        const escapedMessage = escapeMessage(detailsMessage);
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
    let offset = this.state.data.offset;

    offset -= PAGE_LIMIT;

    if (0 <= offset) {
      this.state.data.offset = offset;

      ctx.wizard.selectStep(2);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('nextPage')
  async nextPage(@Ctx() ctx) {
    let offset = this.state.data.offset;

    offset += PAGE_LIMIT;

    if (offset < this.state.data.total) {
      this.state.data.offset = offset;

      ctx.wizard.selectStep(2);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('finishPage')
  async cancelPage(@Ctx() ctx: Scenes.WizardContext) {
    ctx.editMessageText('Finished');
    ctx.scene.leave();
  }

  // Return Consult
  async returnOverall(ctx) {
    const state = ctx.wizard.state as State;
    try {
      const overall = await this.consultsService.getOverall(state);
      const overallMessage = overall.message;
      const stateSign = overall.sign;

      // Stickers
      const stateSticker =
        stateSign > 0
          ? readFileSync('./public/positive.webp')
          : readFileSync('./public/negative.webp');

      const escapedMessage = escapeMessage(overallMessage);
      await ctx.editMessageText(escapedMessage, {
        parse_mode: 'MarkdownV2',
      });
      ctx.sendSticker({ source: stateSticker });
    } catch {
      this.baseTelegram.errorMessage(ctx);
    } finally {
      ctx.scene.leave();
    }
  }

  // get Data
  getPageData(data: Data): Expense[] | Income[] {
    return data.items.slice(data.offset, data.offset + PAGE_LIMIT);
  }

  // No items function
  async noItems(ctx: Scenes.WizardContext, state: State) {
    // Message
    const title = this.consultsService.getTitle(state.summary);

    let emptyMessage;
    if (state.cash == Cash.INCOME) {
      emptyMessage = 'There are no incomes';
    } else if (state.cash == Cash.EXPENSE) {
      emptyMessage = 'There are no expenses';
    } else if (state.cash == Cash.ALL) {
      emptyMessage = 'There are no transactions';
    }

    const message = title + '\n\n' + emptyMessage;

    // Send Message
    const escapedMessage = escapeMessage(message);
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  // return items
  async returnItems(
    ctx: Scenes.WizardContext,
    items: Expense[] | Income[],
    state: State,
  ) {
    // process message
    const detailsMessage = this.consultsService.detailsMessage(
      items,
      state.data,
      state.summary,
      state.cash,
    );

    // Send Message
    const escapedMessage = escapeMessage(detailsMessage);
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
