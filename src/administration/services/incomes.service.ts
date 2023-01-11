import { Injectable } from '@nestjs/common';

import { CreateIncomeDto, UpdateIncomeDto } from '../dto/income.dto';

@Injectable()
export class IncomesService {
  create(createIncomeDto: CreateIncomeDto) {
    return 'This action adds a new administration';
  }

  findAll() {
    return `This action returns all administration`;
  }

  findOne(id: string) {
    return `This action returns a #${id} administration`;
  }

  update(id: string, updateIncomeDto: UpdateIncomeDto) {
    return `This action updates a #${id} administration`;
  }

  remove(id: string) {
    return `This action removes a #${id} administration`;
  }
}
