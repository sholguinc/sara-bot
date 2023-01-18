import { Injectable } from '@nestjs/common';
import { Command, Update, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

import { IncomesService } from './services/incomes.service';
import { ExpensesService } from './services/expenses.service';

@Update()
@Injectable()
export class CashTelegram {
  constructor(
    private readonly incomesService: IncomesService,
    private readonly expensesService: ExpensesService,
  ) {}

  @Command('send')
  async sendCommand(@Ctx() ctx: Context) {
    const button1 = Markup.button.callback('📈 Incomes', 'earnings');
    const button2 = Markup.button.callback('📉 Expenses', 'expenses');
    const button3 = Markup.button.callback('❌ Cancel', 'cancel');

    await ctx.replyWithMarkdownV2(
      'What kind of information do you want to send?',
      Markup.inlineKeyboard([button1, button2, button3]),
    );
  }

  // @Command('consult')
  // async helpCommand(ctx: Context) {
  //   await this.appService.getHelp(ctx);
  // }
}
