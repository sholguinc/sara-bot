import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    await this.verifyUniqueName(createUserDto.username);

    const user = this.userRepository.create(createUserDto);
    await this.userRepository.save(user);
    return user;
  }

  async findAll() {
    const [users, total] = await this.userRepository.findAndCount();
    return { users, total };
  }

  async findActives() {
    return await this.userRepository.findBy({ active: true });
  }

  async findOne(id: string): Promise<User> {
    if (!isValidUUID(id)) {
      throw new BadRequestException(`${id} is not a valid UUID`);
    }
    return await this.userRepository.findOneBy({ id });
  }

  async findOneByName(name: string): Promise<User> {
    const id = await this.getUserIdByName(name);
    return await this.findOne(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    const updatedUser = this.userRepository.preload({
      id: id,
      ...updateUserDto,
    });
    await this.userRepository.save(await updatedUser);
    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return {
      message: `User ${user.username} has been deleted.`,
    };
  }

  private async verifyUniqueName(name: string) {
    const userWithName = await this.userRepository.findOneBy({
      username: name,
    });

    if (userWithName) {
      throw new ForbiddenException(`User with name ${name} already exists.`);
    }
  }

  private async getUserIdByName(name: string) {
    const user = await this.userRepository.findOneBy({ username: name });
    if (!user) throw new NotFoundException(`User '${name}' not found`);
    return user.id;
  }
}
