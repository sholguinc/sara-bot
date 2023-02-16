import { Injectable } from '@nestjs/common';
import { Help, Start, Update, Ctx, Hears, Command } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';

import { AppServices } from './app.service';

@Update()
@Injectable()
export class AppTelegram {
  constructor(private readonly appService: AppServices) {}

  @Start()
  async startCommand(@Ctx() ctx: Context) {
    await this.appService.getHello(ctx);
  }

  @Help()
  async helpCommand(ctx: Context) {
    await this.appService.getHelp(ctx);
  }

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

  @Command('file')
  async fileCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('fileWizardScene');
  }

  @Command('data')
  async dataCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('dataWizardScene');
  }

  @Hears(/\/+/)
  async unknownCommand(ctx: Scenes.SceneContext) {
    await this.appService.unknownCommand(ctx);
  }
}
