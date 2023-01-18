import { IsNotEmpty, IsString, MaxLength, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  readonly concept: string;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
