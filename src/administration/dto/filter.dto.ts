import {
  IsOptional,
  IsPositive,
  ValidateIf,
  Min,
  MaxDate,
  IsDate,
  IsString,
} from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsPositive()
  limit: number;

  @IsOptional()
  @Min(0)
  offset: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @Min(0)
  daysAgo: number;

  @IsOptional()
  @IsDate()
  @MaxDate(new Date())
  @ValidateIf((item) => item.daysAgo === undefined)
  fromDate: Date;

  @IsOptional()
  @Min(0)
  minPrice: number;

  @ValidateIf((item) => item.minPrice)
  @IsPositive()
  maxPrice: number;
}
