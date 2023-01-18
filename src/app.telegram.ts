import { Injectable } from '@nestjs/common';
import { Help, Start, Update, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

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
}
