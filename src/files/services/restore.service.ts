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

import { filterKeys, timestampToISODate } from 'src/utils';
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
      const date = value.transactionDate;
      if (date == '') {
        value.transactionDate = timestampToISODate(value.timestamp);
      }
      return value;
    });
  }

  splitData(data: any[]) {
    const incomes = [];
    const expenses = [];

    const baseKeys = ['concept', 'amount', 'transactionDate', 'timestamp'];

    data.forEach((value) => {
      const cash = value.cash == '' ? Cash.EXPENSE : value.cash;

      if (cash == Cash.EXPENSE) {
        const keys = baseKeys.concat('filename');
        const expense = filterKeys(value, keys);
        expenses.push(expense);
      } else if (cash == Cash.INCOME) {
        const keys = baseKeys.concat('username');
        const income = filterKeys(value, keys);
        incomes.push(income);
      }
    });

    return { incomes, expenses };
  }

  async restoreIncomes(restoreIncomes: RestoreIncomeDto[]) {
    const incomes = this.addDate(restoreIncomes);

    const users = await this.usersByIncomes(incomes);

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
        const date = timestampToISODate(timestamp);

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
