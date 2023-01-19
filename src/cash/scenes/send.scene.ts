import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { CreateIncomeDto } from '../dto/income.dto';
import { CreateExpenseDto } from '../dto/expense.dto';

import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

import { BaseTelegram } from '../../telegram/base.telegram';
import { IncomesService } from '../services/incomes.service';
import { ExpensesService } from '../services/expenses.service';

import { Send } from '../models/send.model';
import { chunkArray, escapeMessage, getDateString } from '../../utils';

// State Interface
interface State {
  type: Send;
  data: CreateIncomeDto | CreateExpenseDto;
}

// Scene
@Wizard('sendWizardScene')
export class SendScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly usersService: UsersService,
    private readonly incomesService: IncomesService,
    private readonly expensesService: ExpensesService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initSend(@Ctx() ctx: Scenes.WizardContext) {
    const button1 = Markup.button.callback('📈 Income', 'sendIncome');
    const button2 = Markup.button.callback('📉 Expense', 'sendExpense');
    const button3 = Markup.button.callback('❌ Cancel', 'cancel');

    await ctx.replyWithMarkdownV2(
      'What kind of information do you want to send?',
      Markup.inlineKeyboard([[button1], [button2], [button3]]),
    );

    ctx.wizard.next();
  }

  // Actions
  @Action('sendIncome')
  async sendIncome(@Ctx() ctx: Scenes.WizardContext) {
    // Init State
    this.state = ctx.wizard.state as State;
    this.state.type = Send.INCOME;
    this.state.data = {} as CreateIncomeDto;

    const users: User[] = await this.usersService.findActives();

    const buttonArray = users.map((user) => {
      const name = user.username;
      return Markup.button.callback(name, `selectUser:${name}`);
    });

    const buttons = chunkArray(buttonArray, 2);

    await ctx.editMessageText(
      'Which user provides the income?',
      Markup.inlineKeyboard(buttons),
    );
  }

  @Action(/selectUser:.+/)
  async selectUser(@Ctx() ctx: Scenes.WizardContext) {
    // Username
    const [, username] = ctx.callbackQuery['data'].split(':');
    (this.state.data as CreateIncomeDto).username = username;
    await ctx.editMessageText('I see, How much is the income amount?');
  }

  @Action('sendExpense')
  async sendExpense(@Ctx() ctx: Scenes.WizardContext) {
    // Init State
    this.state = ctx.wizard.state as State;
    this.state.type = Send.EXPENSE;
    this.state.data = {} as CreateExpenseDto;
    await ctx.editMessageText('I see, How much is the expense amount?');
  }

  // -> User types amount

  @WizardStep(2)
  async getAmount(@Ctx() ctx: Scenes.WizardContext) {
    if ('text' in ctx.message) {
      // Message
      const messageText = ctx.message.text;

      // Amount
      const amountText = parseFloat(messageText).toFixed(2);
      const parsedAmount = Number(amountText);
      this.state.data.amount = isNaN(parsedAmount) ? null : parsedAmount;

      // Type
      await ctx.reply(`Ok, now write the concept of the ${this.state.type}:`);
      ctx.wizard.next();
    }
  }

  // -> User types concept

  @WizardStep(3)
  async getConcept(@Ctx() ctx: Scenes.WizardContext) {
    if ('text' in ctx.message) {
      // Concept
      this.state.data.concept = ctx.message.text;

      // Send Summary
      await this.sendSummary(ctx, ctx.wizard.state as State);

      ctx.wizard.next();
    }
  }

  // Send Summary
  private async sendSummary(ctx: Scenes.WizardContext, state: State) {
    // Date
    const currentDate = getDateString();

    // User
    const userText =
      state.type == Send.INCOME ? `_*User*_: ${state.data['username']}\n` : '';

    // Summary
    const summary =
      `That's it! Data summary is:\n\n` +
      `_*Date*_: ${currentDate}\n` +
      `_*Type*_: ${state.type}\n` +
      userText +
      `_*Amount*_: S/.${state.data.amount}\n` +
      `_*Concept*_: ${state.data.concept}\n`;

    const escapedSummary = escapeMessage(summary);

    // Keyboard
    const confirmButton = Markup.button.callback('✅ Confirm', 'confirmSend');
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const retryButton = Markup.button.callback('🔁 Retry', 'retrySend');
    const keyboard = Markup.inlineKeyboard([
      [confirmButton, cancelButton],
      [retryButton],
    ]);

    await ctx.replyWithMarkdownV2(escapedSummary);
    await ctx.replyWithMarkdownV2('Data is correct?', keyboard);
  }

  // Actions
  @Action('confirmSend')
  async confirmSend(@Ctx() ctx: Scenes.WizardContext) {
    const confirmButton = Markup.button.callback('✅ Yes', 'createEntity');
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const keyboard = Markup.inlineKeyboard([[confirmButton, cancelButton]]);

    await ctx.editMessageText(
      `Data will be sent, \n` + `Are you sure to complete the operation?`,
      keyboard,
    );
  }

  @Action('retrySend')
  async retrySend(@Ctx() ctx) {
    ctx.editMessageText('Retry: ');
    ctx.wizard.selectStep(0);
    ctx.wizard.steps[ctx.wizard.cursor](ctx);
  }

  // Create entity in database
  @Action('createEntity')
  async createEntity(@Ctx() ctx: Scenes.WizardContext) {
    // Loading
    ctx.editMessageText('Loading...');

    // State
    const state = ctx.wizard.state as State;

    // Create entity
    if (state.type == Send.INCOME) {
      const incomeDto = state.data as CreateIncomeDto;
      await this.incomesService.createFromTelegram(incomeDto, ctx);
    } else if (state.type == Send.EXPENSE) {
      const expenseDto = state.data as CreateExpenseDto;
      await this.expensesService.createFromTelegram(expenseDto, ctx);
    }

    // Finish Scene
    ctx.scene.leave();
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
