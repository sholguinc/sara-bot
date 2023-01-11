import { Injectable } from '@nestjs/common';
import { CreateAdministrationDto } from './dto/income.dto';
import { ExpenseDto } from './dto/expense.dto';

@Injectable()
export class AdministrationService {
  create(createAdministrationDto: CreateAdministrationDto) {
    return 'This action adds a new administration';
  }

  findAll() {
    return `This action returns all administration`;
  }

  findOne(id: number) {
    return `This action returns a #${id} administration`;
  }

  update(id: number, updateAdministrationDto: ExpenseDto) {
    return `This action updates a #${id} administration`;
  }

  remove(id: number) {
    return `This action removes a #${id} administration`;
  }
}
