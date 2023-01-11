import { IsBoolean, IsNotEmpty, IsString, IsEnum } from 'class-validator';

import { Role } from '../../auth/models/roles.model';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsEnum(Role)
  @IsNotEmpty()
  readonly role: Role;

  @IsBoolean()
  @IsNotEmpty()
  readonly active: boolean;
}
