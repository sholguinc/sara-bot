import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { CreateExpenseDto } from './expense.dto';
import { CreateIncomeDto } from './income.dto';

export class RestoreExpenseDto extends CreateExpenseDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  transactionDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  timestamp: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  filename: string;
}

export class RestoreIncomeDto extends CreateIncomeDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  transactionDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  timestamp: string;
}
