import { Injectable } from '@nestjs/common';

import { IncomesService } from './incomes.service';
import { ExpensesService } from './expenses.service';

import { FilterDto } from '../dto/filter.dto';

import { Income } from '../entities/income.entity';
import { Expense } from '../entities/expense.entity';

import { Cash } from '../models/cash.model';
import { Summary } from '../models/summary.model';

import { getDateLimits } from '../utils';
import { localString, capitalize } from 'src/utils';

@Injectable()
export class ConsultsService {
  constructor(
    private readonly incomesService: IncomesService,
    private readonly expensesService: ExpensesService,
  ) {}

  async getDetails(state) {
    let data;
    const filter = { summary: state.summary as Summary } as FilterDto;
    if (state.cash == Cash.INCOME) {
      data = await this.incomesService.findSome(filter);
    } else if (state.cash == Cash.EXPENSE) {
      data = await this.expensesService.findSome(filter);
    }

    const message = Array.isArray(data)
      ? this.detailsMessage(data, state.summary, state.cash)
      : data;

    return { message };
  }

  detailsMessage(data: Income[] | Expense[], summary: Summary, cash: Cash) {
    // Title
    const title = this.getTitle(summary);

    // Subtitle
    const subtitle = `_*${cash}s:*_`;

    // Show Data
    const signs = { Income: ' + ', Expense: ' - ' };
    const dataArray = data.map((value) => {
      // Information
      const date = localString(value.transactionDate);
      const sign = signs[cash];
      const amount = Number(value.amount).toFixed(2);
      const concept = value.concept;

      // Data row
      const user = cash == Cash.INCOME ? ' - ' + value.user.username : '';
      return date + ' -> ' + sign + 'S/.' + amount + ' - ' + concept + user;
    });
    const dataText = dataArray.reduce((currentText, row) => {
      return currentText + '\n' + row;
    }, '');

    // Message
    return title + '\n\n' + subtitle + dataText;
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
    if (flow >= 0) {
      cashFlow = `_*Cash Flow:*_ + S/.${flowText}`;
      state = 'State: Positive';
    } else {
      cashFlow = `_*Cash Flow:*_ - S/.${flowText}`;
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
