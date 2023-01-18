import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CashModule } from './cash/cash.module';
import { TelegramModule } from './telegram/telegram.module';
import { MyConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';

import { AppTelegram } from './app.telegram';
import { AppServices } from './app.service';
import { FilesModule } from './files/files.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    MyConfigModule,
    DatabaseModule,
    TelegramModule,
    AuthModule,
    CashModule,
    UsersModule,
    FilesModule,
    AdminModule,
  ],
  providers: [AppTelegram, AppServices],
})
export class AppModule {}
