import { Injectable } from '@nestjs/common';

import { CreateExpenseDto, UpdateExpenseDto } from '../dto/expense.dto';

@Injectable()
export class ExpensesService {
  create(createExpenseDto: CreateExpenseDto) {
    return 'This action adds a new administration';
  }

  findAll() {
    return `This action returns all administration`;
  }

  findOne(id: string) {
    return `This action returns a #${id} administration`;
  }

  update(id: string, updateExpenseDto: UpdateExpenseDto) {
    return `This action updates a #${id} administration`;
  }

  remove(id: string) {
    return `This action removes a #${id} administration`;
  }
}
