import { PartialType } from '@nestjs/mapped-types';
import { CreateAdministrationDto } from './create-administration.dto';

export class UpdateAdministrationDto extends PartialType(CreateAdministrationDto) {}
