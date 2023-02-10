import { Injectable } from '@nestjs/common';
import { Command, Update, InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf, Scenes } from 'telegraf';

@Update()
@Injectable()
export class CashTelegram {
  constructor(@InjectBot() private myBot: Telegraf<Context>) {}

  @Command('send')
  async sendCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('sendWizardScene');
  }

  @Command('consult')
  async consultCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('consultWizardScene');
  }

  @Command('search')
  async searchCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('searchWizardScene');
  }
}
