import {
  Logger,
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    await this.verifyUniqueName(createUserDto.username);

    try {
      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    try {
      const users = await this.userRepository.find();
      if (users.length == 0) {
        return { message: 'There are no users' };
      }
      return users;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(id: string): Promise<User> {
    if (!isValidUUID(id)) {
      throw new BadRequestException(`${id} is not a valid UUID`);
    }
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findOneByName(name: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ username: name });
    if (!user) {
      throw new NotFoundException(`User '${name}' not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    try {
      const updatedUser = this.userRepository.preload({
        id: id,
        ...updateUserDto,
      });
      await this.userRepository.save(await updatedUser);
      return updatedUser;
    } catch (error) {
      this.handleDBExceptions(error);
    }
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

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
