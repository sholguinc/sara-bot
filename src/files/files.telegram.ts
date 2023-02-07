import { Injectable } from '@nestjs/common';
import { Command, Update, InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf, Scenes } from 'telegraf';

@Update()
@Injectable()
export class FilesTelegram {
  constructor(@InjectBot() private myBot: Telegraf<Context>) {}

  @Command('file')
  async sendCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('fileWizardScene');
  }
}
