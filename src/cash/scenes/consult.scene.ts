import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';

import { Cash } from '../models/cash.model';
import { Type } from '../models/type.model';
import { Summary } from '../models/summary.model';

import { chunkArray, escapeMessage } from 'src/utils';
import { cashButtons, summaryButtons, typeButtons } from '../utils';
import { ConsultsService } from '../services/consults.service';
import { readFileSync } from 'fs';

// State Interface
interface State {
  type: Type;
  cash: Cash;
  summary: Summary;
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

    const buttonArray = summaryButtons();
    const buttons = chunkArray(buttonArray, 2);

    await ctx.replyWithMarkdownV2(
      'Choose a type of consult:',
      Markup.inlineKeyboard(buttons),
    );
    ctx.wizard.next();
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
      await this.returnConsult(ctx);
    }
  }

  // -> User select cash type

  @Action(/cash:.+/)
  async cashType(@Ctx() ctx: Scenes.WizardContext) {
    // Type
    const [, cash] = ctx.callbackQuery['data'].split(':');
    this.state.cash = cash;

    await ctx.editMessageText('Loading...');
    await this.returnConsult(ctx);
  }

  // Return Consult
  async returnConsult(ctx: Scenes.WizardContext) {
    const state = ctx.wizard.state as State;
    let consultMessage;
    let stateSticker;
    if (state.type == Type.DETAILS) {
      const details = await this.consultsService.getDetails(state);
      consultMessage = details.message;
    } else if (state.type == Type.OVERALL) {
      const overall = await this.consultsService.getOverall(state);
      consultMessage = overall.message;
      const stateSign = overall.sign;

      // Stickers
      stateSticker =
        stateSign >= 0
          ? readFileSync('./public/positive.webp')
          : readFileSync('./public/negative.webp');
    }

    const escapedMessage = escapeMessage(consultMessage);
    await ctx.replyWithMarkdownV2(escapedMessage);
    if (state.type == Type.OVERALL) {
      ctx.sendSticker({ source: stateSticker });
    }
    ctx.scene.leave();
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
