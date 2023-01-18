import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateIncomeDto {
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  readonly concept: string;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}
