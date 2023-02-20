import { Injectable } from '@nestjs/common';

import { BaseTelegram } from '../../telegram/base.telegram';
import { ExpensesService } from '../../cash/services/expenses.service';
import { IncomesService } from '../../cash/services/incomes.service';
import { UsersService } from '../../users/users.service';
import { FilesService } from './files.service';

import { Cash } from '../../cash/models/cash.model';

import {
  RestoreExpenseDto,
  RestoreIncomeDto,
} from '../../cash/dto/restore.dto';

import { RestoreFileDto } from '../dto/restore-file.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';

import { dateFromMillis, dateToString, filterKeys } from 'src/utils';
import { Role } from '../../auth/models/roles.model';

@Injectable()
export class RestoreService {
  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly expensesService: ExpensesService,
    private readonly incomesService: IncomesService,
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  addDate(data: any[]) {
    return data.map((value) => {
      if (value.transactionDate) {
        return value;
      } else {
        return { ...value, transactionDate: dateFromMillis(value.timestamp) };
      }
    });
  }

  splitData(data: any[]) {
    const incomes = [];
    const expenses = [];

    const keys = ['concept', 'amount', 'transactionDate', 'timestamp'];

    data.forEach((value) => {
      const cash = value.cash ?? Cash.EXPENSE;

      if (cash == Cash.EXPENSE) {
        keys.push('filename');
        const expense = filterKeys(value, keys);
        expenses.push(expense);
      } else if (cash == Cash.INCOME) {
        keys.push('username');
        const income = filterKeys(value, keys);
        incomes.push(income);
      }
    });

    return { incomes, expenses };
  }

  async restoreIncomes(restoreIncomes: RestoreIncomeDto[]) {
    const incomes = this.addDate(restoreIncomes);

    const users = this.usersByIncomes(incomes);

    // await this.
    await this.incomesService.restoreIncomes(incomes, users);
  }

  async restoreExpenses(restoreExpenses: RestoreExpenseDto[]) {
    const expenses = this.addDate(restoreExpenses);

    const filesToCreate = this.filesByExpenses(expenses);

    const filesObject = await this.restoreFiles(filesToCreate);
    await this.expensesService.restoreExpenses(expenses, filesObject);
  }

  filesByExpenses(expenses: RestoreExpenseDto[]): RestoreFileDto[] {
    const expensesWithFiles = expenses.filter((expense) => expense.filename);

    const filesObject = expensesWithFiles.reduce((object, expense) => {
      const filename = expense.filename;
      if (!object[filename]) {
        const timestamp = this.getTimestampFromName(filename);
        const datetime = dateFromMillis(timestamp);
        const date = dateToString(datetime);

        object[filename] = {
          name: filename,
          total: 0,
          date,
          timestamp,
        } as RestoreFileDto;
      }

      object[filename].total += expense.amount;
      return object;
    }, {});

    return Object.values(filesObject) as RestoreFileDto[];
  }

  async usersByIncomes(incomes: RestoreIncomeDto[]) {
    const usersObject = {};

    for (const income of incomes) {
      const username = income.username;
      let user = await this.usersService.findOneByName(username);

      if (!user) {
        const role = username == 'Sergio' ? Role.ADMIN : Role.MEMBER;
        const userDto = { username, role, active: true } as CreateUserDto;
        user = await this.usersService.create(userDto);
      }

      usersObject[username] = user;
    }
    return usersObject;
  }

  getTimestampFromName(filename: string) {
    const firstString = filename.split('.')[0];
    const firstWords = firstString.split('-');
    const [timestamp] = firstWords.slice(-1);
    return timestamp;
  }

  async restoreFiles(restoreFiles: RestoreFileDto[]) {
    const createdFiles = await this.filesService.createFiles(restoreFiles);

    return createdFiles.reduce((object, file) => {
      object[file.name] = file;
      return object;
    }, {});
  }
}
