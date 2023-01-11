import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

import { telegramAsyncConfig } from './telegram.config';

@Module({
  imports: [TelegrafModule.forRootAsync(telegramAsyncConfig)],
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
