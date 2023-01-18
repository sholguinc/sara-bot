import { PrimaryGeneratedColumn, Column, Entity, OneToMany, Index } from 'typeorm';

import { Role } from 'src/auth/models/roles.model';
import { Income } from '../../cash/entities/income.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 10, unique: true })
  username: string;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;

  @Column({ type: 'boolean' })
  active: boolean;

  @OneToMany(() => Income, (income) => income.user)
  incomes: Income[];
}
