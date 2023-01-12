import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, ILike } from 'typeorm';
import { validate as isValidUUID } from 'uuid';

import { FilterDto } from '../dto/filter.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../dto/expense.dto';
import { Expense } from '../entities/expense.entity';
import { subtractDays } from 'src/utils';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger('ExpensesService');

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto) {
    try {
      const expense = this.expenseRepository.create(createExpenseDto);
      await this.expenseRepository.save(expense);
      return expense;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findSome(params?: FilterDto) {
    const where: FindOptionsWhere<Expense> = {};
    const { limit = 10, offset = 0 } = params;
    const { name } = params;
    const { daysAgo = 7, fromDate } = params;
    const { maxPrice, minPrice } = params;

    // Name Filter
    if (name) {
      where.concept = ILike(`%${name}%`);
    }

    // Date Filter
    const currentDate = new Date();
    if (fromDate) {
      where.transactionDate = Between(fromDate, currentDate);
    } else {
      const agoDate = subtractDays(currentDate, daysAgo);
      where.transactionDate = Between(agoDate, currentDate);
    }

    // Price Filter
    if (minPrice && maxPrice) {
      where.amount = Between(minPrice, maxPrice);
    }

    try {
      const expenses = await this.expenseRepository.find({
        take: limit,
        skip: offset,
        where,
      });
      if (expenses.length == 0) {
        return { message: 'There are no expenses' };
      }
      return expenses;
    } catch (error) {
      this.handleDBExceptions(error);
    }
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
    try {
      const updatedExpense = this.expenseRepository.preload({
        id: id,
        ...updateExpenseDto,
      });
      await this.expenseRepository.save(await updatedExpense);
      return updatedExpense;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const expense = await this.findOne(id);
    await this.expenseRepository.remove(expense);
    return {
      message: `Expense has been deleted.`,
    };
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
