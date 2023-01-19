import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';

import { UsersService } from '../../users/users.service';
import { CreateIncomeDto, UpdateIncomeDto } from '../dto/income.dto';
import { Income } from '../entities/income.entity';
import { FilterDto } from '../dto/filter.dto';
import { Summary } from '../models/summary.model';
import { getLimits, priceFilter } from '../../utils';
import { BaseTelegram } from '../../telegram/base.telegram';

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
    const where: FindOptionsWhere<Income> = {};
    const { limit = 10, offset = 0 } = params;
    const { name, summary = Summary.MONTH } = params;
    const { minPrice, maxPrice } = params;
    const { username } = params;

    // User Filter
    if (username) {
      await this.usersService.findOneByName(username);
      where.user = { username };
    }

    // Name Filter
    if (name) {
      where.concept = ILike(`%${name}%`);
    }

    // Date Filter
    const { lowerLimit, upperLimit } = getLimits(summary);
    where.timestamp = Between(lowerLimit, upperLimit);

    // Price Filter
    if (minPrice || maxPrice) {
      where.amount = priceFilter(minPrice, maxPrice);
    }

    const incomes = await this.incomeRepository.find({
      relations: ['user'],
      take: limit,
      skip: offset,
      where,
    });
    if (incomes.length == 0) {
      return { message: 'There are no incomes' };
    }
    return incomes;
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
}
