import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { SearchService } from '../services/search.service';

import { FilterDto } from '../dto/filter.dto';
import { Search, searchMessage } from '../utils';

import { searchButtons, summaryButtons } from '../utils';
import { chunkArray, escapeMessage } from 'src/utils';
import { Summary } from '../models/summary.model';

// State Interface
interface State {
  search: Search;
  criteria: any[];
  filter: FilterDto;
  criteriaMessage: string;
}

// Scene
@Wizard('searchWizardScene')
export class SearchScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly searchService: SearchService,
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
  async search(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Loading...');

    try {
      // Search Message
      const searchMessage = await this.searchService.getSearch(
        this.state.filter,
        this.state.criteriaMessage,
      );

      // Send message
      const escapedMessage = escapeMessage(searchMessage);
      await ctx.editMessageText(escapedMessage, {
        parse_mode: 'MarkdownV2',
      });
    } catch {
      this.baseTelegram.errorMessage(ctx);
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
