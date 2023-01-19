import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BaseTelegram } from './base.telegram';

import { telegramAsyncConfig } from './telegram.config';

@Module({
  imports: [TelegrafModule.forRootAsync(telegramAsyncConfig)],
  providers: [BaseTelegram],
  exports: [BaseTelegram],
})
export class TelegramModule {}
