import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsNumber,
  validateSync,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { plainToInstance } from 'class-transformer';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  concept: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}

// Validate Expense
export function validateExpense(object: object) {
  const toValidate = plainToInstance(CreateExpenseDto, object);
  return validateSync(toValidate);
}
