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

  @Command('upload')
  async uploadCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('uploadWizardScene');
  }

  @Command('files')
  async filesCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('filesWizardScene');
  }

  @Command('users')
  async usersCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('usersWizardScene');
  }

  @Command('activate')
  async activateCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('activateWizardScene');
  }

  @Command('data')
  async dataCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('dataWizardScene');
  }

  @Command('restore')
  async restoreCommand(ctx: Scenes.SceneContext) {
    ctx.scene.enter('restoreWizardScene');
  }

  @Hears(/\/+/)
  async unknownCommand(ctx: Scenes.SceneContext) {
    await this.appService.unknownCommand(ctx);
  }

  @Hears(/[^\/]+/)
  async replyText(ctx: Scenes.SceneContext) {
    await this.appService.replyText(ctx);
  }
}
