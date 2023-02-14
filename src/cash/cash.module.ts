import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';

import { Expense } from './entities/expense.entity';
import { ExpensesService } from './services/expenses.service';

import { Income } from './entities/income.entity';
import { IncomesService } from './services/incomes.service';

import { CashTelegram } from './cash.telegram';
import { TelegramModule } from '../telegram/telegram.module';

import { SendScene } from './scenes/send.scene';
import { ConsultScene } from './scenes/consult.scene';
import { SearchScene } from './scenes/search.scene';
import { ConsultsService } from './services/consults.service';
import { ExpensesController } from './controllers/expenses.controller';
import { IncomesController } from './controllers/incomes.controller';
import { SearchService } from './services/search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Income]),
    UsersModule,
    TelegramModule,
  ],
  controllers: [ExpensesController, IncomesController],
  providers: [
    ExpensesService,
    IncomesService,
    ConsultsService,
    SearchService,
    CashTelegram,
    SendScene,
    ConsultScene,
    SearchScene,
  ],
  exports: [ExpensesService, IncomesService],
})
export class CashModule {}
