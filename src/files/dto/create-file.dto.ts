import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFileDto {
  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsString()
  @IsNotEmpty()
  size: string;
}
