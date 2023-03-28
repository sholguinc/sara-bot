import { Injectable } from '@nestjs/common';

import { IncomesService } from './incomes.service';
import { ExpensesService } from './expenses.service';

import { FilterDto } from '../dto/filter.dto';
import { PAGE_LIMIT } from '../../config/constants';

import { Income } from '../entities/income.entity';
import { Expense } from '../entities/expense.entity';

import { Cash } from '../models/cash.model';
import { Summary } from '../models/summary.model';

import { getDateLimits } from '../utils';
import { capitalize, localString, mergeItems } from 'src/utils';

@Injectable()
export class ConsultsService {
  constructor(
    private readonly incomesService: IncomesService,
    private readonly expensesService: ExpensesService,
  ) {}

  async getDetails(state) {
    let items, total;
    const filter = { summary: state.summary as Summary } as FilterDto;
    if (state.cash == Cash.INCOME) {
      const results = await this.incomesService.findSome(filter);
      items = results.incomes;
      total = results.total;
    } else if (state.cash == Cash.EXPENSE) {
      const results = await this.expensesService.findSome(filter);
      items = results.expenses;
      total = results.total;
    } else if (state.cash == Cash.ALL) {
      const incomes = await this.incomesService.findSome(filter);
      const expenses = await this.expensesService.findSome(filter);

      items = mergeItems(expenses.expenses, incomes.incomes);
      total = incomes.total + expenses.total;
    }

    return { items, total };
  }

  detailsMessage(
    items: Income[] | Expense[],
    data,
    summary: Summary,
    cash: Cash,
  ) {
    // Title
    const title = this.getTitle(summary);

    // Pagination
    const total = data.total;
    const lowerLimit = Math.max(data.offset + 1, 1);
    const upperLimit = Math.min(data.offset + PAGE_LIMIT, total);
    const page = `${lowerLimit}-${upperLimit} of ${total}`;

    // Subtitle
    let subtitle = `_*${cash}s (${page}):*_`;

    if (cash == Cash.ALL) {
      subtitle = `_*Transactions (${page}):*_`;
    }

    // Show Data
    const dataArray = items.map((value) => {
      // Information
      const date = localString(value.transactionDate);
      const amount = Number(value.amount).toFixed(2);

      let sign, add;
      if (value instanceof Expense) {
        sign = ' - ';
        add = value.concept;
      } else if (value instanceof Income) {
        sign = ' + ';
        add = value.user.username;
      }

      // Data row
      return date + ' -> ' + sign + 'S/.' + amount + ' - ' + add;
    });

    // Message
    return title + '\n\n' + subtitle + '\n' + dataArray.join('\n');
  }

  async getOverall(state) {
    const filter = { summary: state.summary as Summary } as FilterDto;
    // data
    const totalIncome = await this.incomesService.getSum(filter);
    const totalExpense = await this.expensesService.getSum(filter);

    return this.overallMessage(state.summary, totalIncome, totalExpense);
  }

  overallMessage(summary: Summary, totalIncome: number, totalExpense: number) {
    // Title
    const title = this.getTitle(summary);

    // Cash
    const income = `_*Income:*_ + S/.${totalIncome.toFixed(2)}`;
    const expense = `_*Expenses:*_ - S/.${totalExpense.toFixed(2)}`;

    // Cash Flow
    let cashFlow, state;
    const flow = totalIncome - totalExpense;
    const flowText = Math.abs(flow).toFixed(2);
    const sign = Math.sign(flow);
    if (flow > 0) {
      cashFlow = `_*Cash Flow:*_ + S/.${flowText}`;
      state = 'State: Positive';
    } else if (flow < 0) {
      cashFlow = `_*Cash Flow:*_ - S/.${flowText}`;
      state = 'State: Negative';
    } else {
      cashFlow = `_*Cash Flow:*_ + S/.${flowText}`;
      state = 'State: Negative';
    }

    // Message
    const message =
      title + '\n\n' + income + '\n' + expense + '\n' + cashFlow + '\n' + state;

    return { message, sign };
  }

  // Consult Title
  getTitle(summary: Summary) {
    const { lowerDate, upperDate } = getDateLimits(summary);
    const summaryName = capitalize(summary);
    return `_*${summaryName} Summary*_ (${lowerDate} - ${upperDate}):`;
  }
}
