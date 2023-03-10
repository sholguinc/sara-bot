import { IsOptional, IsPositive, Min, IsString, IsEnum } from 'class-validator';

import { Summary } from '../models/summary.model';

export class FilterDto {
  @IsOptional()
  @IsString()
  likeName: string;

  @IsOptional()
  @IsEnum(Summary)
  summary: Summary;

  @IsOptional()
  @Min(0)
  minPrice: number;

  @IsOptional()
  @IsPositive()
  maxPrice: number;

  @IsOptional()
  @IsString()
  username: string;
}
