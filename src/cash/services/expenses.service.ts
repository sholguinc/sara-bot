import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';

import { BaseTelegram } from '../../telegram/base.telegram';
import { getWhereOptions } from '../utils';

import { File } from '../../files/entities/file.entity';
import { Expense } from '../entities/expense.entity';
import { FilterDto } from '../dto/filter.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../dto/expense.dto';
import { RestoreExpenseDto } from '../dto/restore.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly baseTelegram: BaseTelegram,
  ) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const expense = this.expenseRepository.create(createExpenseDto);
    await this.expenseRepository.save(expense);
    return expense;
  }

  async findSome(params?: FilterDto) {
    const where: FindOptionsWhere<Expense> = await getWhereOptions(params);

    const [expenses, total] = await this.expenseRepository.findAndCount({
      relations: ['file'],
      where,
      order: {
        timestamp: 'DESC',
      },
    });

    return { expenses, total };
  }

  async findByFile(file: File) {
    const fileId = file.id;
    const [expenses, total] = await this.expenseRepository.findAndCount({
      relations: ['file'],
      where: {
        file: {
          id: fileId,
        },
      },
    });

    return { expenses, total };
  }

  async findOne(id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException(`${id} is not a valid UUID`);
    }
    const expense = await this.expenseRepository.findOneBy({ id });
    if (!expense) {
      throw new NotFoundException(`Expense with id ${id} not found`);
    }
    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(id);
    const updatedExpense = this.expenseRepository.preload({
      id: id,
      ...updateExpenseDto,
    });
    await this.expenseRepository.save(await updatedExpense);
    return updatedExpense;
  }

  async remove(id: string) {
    const expense = await this.findOne(id);
    await this.expenseRepository.remove(expense);
    return {
      message: `Expense has been deleted.`,
    };
  }

  // Create expense from telegram
  async createFromTelegram(createExpenseDto: CreateExpenseDto, ctx) {
    try {
      const expense = await this.create(createExpenseDto);
      expense instanceof Expense
        ? this.baseTelegram.completedMessage(ctx)
        : this.baseTelegram.errorMessage(ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx);
    }
  }

  // Get sum of incomes
  async getSum(params?: FilterDto) {
    let totalSum = 0;
    const where: FindOptionsWhere<Expense> = await getWhereOptions(params);
    const expenses = await this.expenseRepository.find({ where });
    if (expenses.length !== 0) {
      const amountArray = expenses.map((income) => {
        return Number(income.amount);
      });
      totalSum = amountArray.reduce((acc, value) => {
        return acc + value;
      }, 0);
    }
    return totalSum;
  }

  // Create data from an array of expenses
  async createExpenses(createExpenses: CreateExpenseDto[], file: File) {
    const expenses = this.expenseRepository.create(createExpenses);

    // Add relationship
    expenses.forEach((expense) => (expense.file = file));

    await this.expenseRepository.save(expenses);
  }

  // restore
  async restoreExpenses(
    restoreExpenses: RestoreExpenseDto[],
    filesObject: object,
  ) {
    const expenses = this.expenseRepository.create(restoreExpenses);

    // Add relationship
    expenses.forEach((expense, index) => {
      if (!expense.filename) {
        const restoreExpense = restoreExpenses[index];
        const file = filesObject[restoreExpense.filename];
        expense.file = file as File;
      }
    });

    await this.expenseRepository.save(expenses);
  }
}
