import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';

import { UsersService } from '../../users/users.service';
import { BaseTelegram } from '../../telegram/base.telegram';
import { getWhereOptions } from '../utils';

import { CreateIncomeDto, UpdateIncomeDto } from '../dto/income.dto';
import { FilterDto } from '../dto/filter.dto';
import { Income } from '../entities/income.entity';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    private readonly usersService: UsersService,
    private readonly baseTelegram: BaseTelegram,
  ) {}

  async create(createIncomeDto: CreateIncomeDto) {
    const income = this.incomeRepository.create(createIncomeDto);
    income.user = await this.usersService.findOneByName(
      createIncomeDto.username,
    );
    await this.incomeRepository.save(income);
    return income;
  }

  async findSome(params?: FilterDto) {
    const where: FindOptionsWhere<Income> = await getWhereOptions(params);

    const [incomes, total] = await this.incomeRepository.findAndCount({
      relations: ['user'],
      where,
      order: {
        timestamp: 'DESC',
      },
    });

    return { incomes, total };
  }

  async findOne(id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException(`${id} is not a valid UUID`);
    }
    const income = await this.incomeRepository.findOne({
      relations: ['user'],
      where: { id },
    });
    if (!income) {
      throw new NotFoundException(`Income with id ${id} not found`);
    }
    return income;
  }

  async update(id: string, updateIncomeDto: UpdateIncomeDto) {
    // Fields
    const { username, ...updateInfo } = updateIncomeDto;

    // Update other fields
    await this.incomeRepository.update(id, updateInfo);

    // Update user field
    let income = await this.findOne(id);
    if (username) {
      income.user = await this.usersService.findOneByName(username);
      income = await this.incomeRepository.save(income);
    }

    return income;
  }

  async remove(id: string) {
    const income = await this.findOne(id);
    await this.incomeRepository.remove(income);
    return {
      message: `Income has been deleted.`,
    };
  }

  // Create income from telegram
  async createFromTelegram(createIncomeDto: CreateIncomeDto, ctx) {
    try {
      const income = await this.create(createIncomeDto);
      income instanceof Income
        ? this.baseTelegram.completedMessage(ctx)
        : this.baseTelegram.errorMessage(ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx);
    }
  }

  // Get sum of incomes
  async getSum(params?: FilterDto) {
    let totalSum = 0;
    const where: FindOptionsWhere<Income> = await getWhereOptions(params);
    const incomes = await this.incomeRepository.find({ where });
    if (incomes.length !== 0) {
      const amountArray = incomes.map((income) => {
        return Number(income.amount);
      });
      totalSum = amountArray.reduce((acc, value) => {
        return acc + value;
      }, 0);
    }
    return totalSum;
  }
}
