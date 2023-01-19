import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

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
