import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { CashModule } from './cash/cash.module';
import { TelegramModule } from './telegram/telegram.module';
import { MyConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';

import { AppTelegram } from './app.telegram';
import { AppServices } from './app.service';
import { FilesModule } from './files/files.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    MyConfigModule,
    DatabaseModule,
    TelegramModule,
    CashModule,
    UsersModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppTelegram, AppServices],
})
export class AppModule {}
