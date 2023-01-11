import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { AdministrationModule } from './administration/administration.module';
import { TelegramModule } from './telegram/telegram.module';
import { MyConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    MyConfigModule,
    DatabaseModule,
    TelegramModule,
    AuthModule,
    AdministrationModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
