import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  validateSync,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { plainToInstance } from 'class-transformer';

export class CreateIncomeDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  concept: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}

// Validate Income
export function validateIncome(object: object) {
  const toValidate = plainToInstance(CreateIncomeDto, object);
  return validateSync(toValidate);
}
