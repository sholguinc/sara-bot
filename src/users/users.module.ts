import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersScene } from './scenes/users.scene';
import { ActivateScene } from './scenes/activate.scene';

import { TelegramModule } from '../telegram/telegram.module';
import { CashModule } from '../cash/cash.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TelegramModule,
    forwardRef(() => CashModule),
  ],
  providers: [UsersService, UsersScene, ActivateScene],
  exports: [UsersService],
})
export class UsersModule {}
