import { Injectable } from '@nestjs/common';
import { CreateAdministrationDto } from './dto/create-administration.dto';
import { UpdateAdministrationDto } from './dto/update-administration.dto';

@Injectable()
export class AdministrationService {
  create(createAdministrationDto: CreateAdministrationDto) {
    return 'This action adds a new administration';
  }

  findAll() {
    return `This action returns all administration`;
  }

  findOne(id: number) {
    return `This action returns a #${id} administration`;
  }

  update(id: number, updateAdministrationDto: UpdateAdministrationDto) {
    return `This action updates a #${id} administration`;
  }

  remove(id: number) {
    return `This action removes a #${id} administration`;
  }
}
