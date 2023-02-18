import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';

import { Expense } from './entities/expense.entity';
import { ExpensesService } from './services/expenses.service';

import { Income } from './entities/income.entity';
import { IncomesService } from './services/incomes.service';

import { ConsultsService } from './services/consults.service';
import { TelegramModule } from '../telegram/telegram.module';

import { SendScene } from './scenes/send.scene';
import { ConsultScene } from './scenes/consult.scene';
import { SearchScene } from './scenes/search.scene';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Income]),
    forwardRef(() => UsersModule),
    TelegramModule,
  ],
  providers: [
    ExpensesService,
    IncomesService,
    ConsultsService,
    SendScene,
    ConsultScene,
    SearchScene,
  ],
  exports: [ExpensesService, IncomesService, ConsultsService],
})
export class CashModule {}
