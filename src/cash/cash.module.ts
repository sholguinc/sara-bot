import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';

import { Expense } from './entities/expense.entity';
import { ExpensesService } from './services/expenses.service';

import { Income } from './entities/income.entity';
import { IncomesService } from './services/incomes.service';

import { CashTelegram } from './cash.telegram';

import { SendScene } from './scenes/send.scene';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Income]),
    UsersModule,
    TelegramModule,
  ],
  providers: [ExpensesService, IncomesService, CashTelegram, SendScene],
})
export class CashModule {}
