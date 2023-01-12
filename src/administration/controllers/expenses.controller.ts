import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { ExpensesService } from '../services/expenses.service';
import { FilterDto } from '../dto/filter.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../dto/expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  // @Post()
  // uploadFile(@Body() createExpenseDto: CreateExpenseDto) {
  //   return this.expensesService.uploadFile(createExpenseDto);
  // }

  @Get()
  findSome(@Query() params?: FilterDto) {
    return this.expensesService.findSome(params);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
