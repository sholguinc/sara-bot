import { CreateFileDto } from './create-file.dto';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RestoreFileDto extends CreateFileDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  timestamp: string;
}
