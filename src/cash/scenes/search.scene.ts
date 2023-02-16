import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { ExpensesService } from '../services/expenses.service';

import { FilterDto } from '../dto/filter.dto';
import { pageButtons, Search, searchMessage } from '../utils';
import { PAGE_LIMIT } from '../../config/constants';

import { searchButtons, summaryButtons } from '../utils';
import { chunkArray, escapeMessage, localString } from 'src/utils';
import { Summary } from '../models/summary.model';
import { Expense } from '../entities/expense.entity';

// data interface
interface Data {
  offset: number;
  total: number;
  expenses: Expense[];
}

// State Interface
interface State {
  search: Search;
  criteria: any[];
  filter: FilterDto;
  criteriaMessage: string;
  data: Data;
}

// Scene
@Wizard('searchWizardScene')
export class SearchScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly expensesService: ExpensesService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initSearch(@Ctx() ctx: Scenes.WizardContext) {
    // Init State
    this.state = ctx.wizard.state as State;
    this.state.search = {
      likeName: false,
      minPrice: false,
      maxPrice: false,
    };
    this.state.criteria = [];
    this.state.filter = {} as FilterDto;
    this.state.criteriaMessage = '';
    this.state.data = { offset: 0 } as Data;

    const buttonArray = summaryButtons();
    const buttons = chunkArray(buttonArray, 2);

    await ctx.replyWithMarkdownV2(
      'Choose a period in which to search:',
      Markup.inlineKeyboard(buttons),
    );
  }

  // User select time period
  @Action(/summary:.+/)
  async getTime(@Ctx() ctx: Scenes.WizardContext) {
    const [, summary] = ctx.callbackQuery['data'].split(':');
    this.state.filter.summary = summary as Summary;

    const buttons = searchButtons();
    const { message } = searchMessage(this.state.search);

    await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
  }

  // -> User select search criteria

  @Action(/criterion:.+/)
  async selectCriteria(@Ctx() ctx: Scenes.WizardContext) {
    // Get Criteria
    const [, criterion] = ctx.callbackQuery['data'].split(':');

    // Change criteria state
    this.state.search[criterion] = !this.state.search[criterion];
    // Buttons
    const buttons = searchButtons();

    // Update
    const { message, criteria } = searchMessage(this.state.search);

    // State
    this.state.criteria = criteria;

    // Change message
    await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
  }

  // -> User select continue

  @Action('continueSearch')
  async writeCriteria(@Ctx() ctx) {
    ctx.wizard.next();
    ctx.wizard.steps[ctx.wizard.cursor](ctx);
  }

  @WizardStep(2)
  async sendMessageCriteria(@Ctx() ctx: Scenes.WizardContext) {
    const format = '-> ' + this.state.criteria.join(', ');
    const message = 'Write the criteria like this:' + '\n\n' + format;
    await ctx.editMessageText(message);

    ctx.wizard.next();
  }

  // -> User types criteria

  @WizardStep(3)
  async getCriteria(@Ctx() ctx: Scenes.WizardContext) {
    if ('text' in ctx.message) {
      const values = ctx.message.text.split(', ');

      const criteriaArray = values.map((value, index) => {
        // Criterion
        const criterion = this.state.criteria[index];

        // Save Value
        this.state.filter[criterion] = value;

        return `-> ${criterion}: ${value}`;
      });

      const criteriaMessage = criteriaArray.join('\n');
      this.state.criteriaMessage = criteriaMessage;

      const message = 'Search criteria is:' + '\n\n' + criteriaMessage;

      const confirmButton = Markup.button.callback(
        '🔎 Search',
        'confirmSearch',
      );
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
      const retryButton = Markup.button.callback('🔁 Retry', 'retrySearch');
      const keyboard = Markup.inlineKeyboard([
        [confirmButton, cancelButton],
        [retryButton],
      ]);

      await ctx.replyWithMarkdownV2(escapeMessage(message), keyboard);
    }
  }

  @Action('retrySearch')
  async retrySend(@Ctx() ctx) {
    ctx.wizard.selectStep(1);
    ctx.wizard.steps[ctx.wizard.cursor](ctx);
  }

  @Action('confirmSearch')
  async search(@Ctx() ctx) {
    await ctx.editMessageText('Loading...');
    try {
      const { expenses, total } = await this.expensesService.findSome(
        this.state.filter,
      );

      if (total == 0) {
        await this.noExpenses(ctx, this.state.criteriaMessage);
        ctx.scene.leave();
      } else if (total <= PAGE_LIMIT) {
        this.state.data.total = total;
        await this.returnExpenses(ctx, expenses, this.state);
        ctx.scene.leave();
      } else {
        this.state.data.expenses = expenses;
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

  @WizardStep(4)
  async pagination(@Ctx() ctx: Scenes.WizardContext) {
    try {
      if (!ctx.message) {
        // data
        const pageData = this.getPageData(this.state.data);

        // process message
        const searchMessage = this.getSearchMessage(pageData, this.state);
        const escapedMessage = escapeMessage(searchMessage);
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

      ctx.wizard.selectStep(3);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('nextPage')
  async nextPage(@Ctx() ctx) {
    let offset = this.state.data.offset;

    offset += PAGE_LIMIT;

    if (offset < this.state.data.total) {
      this.state.data.offset = offset;

      ctx.wizard.selectStep(3);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('finishPage')
  async cancelPage(@Ctx() ctx: Scenes.WizardContext) {
    ctx.editMessageText('Finished');
    ctx.scene.leave();
  }

  // No expenses function
  async noExpenses(ctx, criteriaMessage: string) {
    // Message
    const criteria = '_*Search criteria:*_' + '\n' + criteriaMessage;
    const message = criteria + '\n\n' + 'There are no expenses';

    // Send Message
    const escapedMessage = escapeMessage(message);
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  // return expenses
  async returnExpenses(ctx, expenses: Expense[], state: State) {
    // Message
    const searchMessage = this.getSearchMessage(expenses, state);
    const escapedMessage = escapeMessage(searchMessage);

    // Send Message
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  // get Data
  getPageData(data: Data): Expense[] {
    return data.expenses.slice(data.offset, data.offset + PAGE_LIMIT);
  }

  // Message function
  getSearchMessage(expenses: Expense[], state: State) {
    const header = '_*Search criteria:*_' + '\n' + state.criteriaMessage;

    const offset = this.state.data.offset;
    const total = this.state.data.total;
    const lowerLimit = Math.max(offset + 1, 1);
    const upperLimit = Math.min(offset + PAGE_LIMIT, total);
    const page = `${lowerLimit}-${upperLimit} of ${total}`;

    const items = expenses.map((expense) => {
      // Information
      const date = localString(expense.transactionDate);
      const amount = Number(expense.amount).toFixed(2);
      const concept = expense.concept;

      return date + ' -> ' + '-' + 'S/.' + amount + ' - ' + concept;
    });

    const results = `_*Search results (${page}):*_` + '\n' + items.join('\n');

    return header + '\n\n' + results;
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
