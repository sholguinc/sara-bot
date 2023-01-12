import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';

import { Expense } from './entities/expense.entity';
import { ExpensesController } from './controllers/expenses.controller';
import { ExpensesService } from './services/expenses.service';

import { Income } from './entities/income.entity';
import { IncomesController } from './controllers/incomes.controller';
import { IncomesService } from './services/incomes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Income]), UsersModule],
  controllers: [ExpensesController, IncomesController],
  providers: [ExpensesService, IncomesService],
})
export class AdministrationModule {}
