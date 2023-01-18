import { Injectable } from '@nestjs/common';
import { Update, Ctx, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { UsersService } from './users.service';

@Update()
@Injectable()
export class UsersTelegram {
  constructor(private readonly userService: UsersService) {}

  @Command('/users')
  async startCommand(@Ctx() ctx: Context) {
    await ctx.reply(`Hi User`);
  }
}
