import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity({ name: 'incomes' })
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  concept: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({
    name: 'transaction_date',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  transactionDate: Date;

  @ManyToOne(() => User, (user) => user.incomes)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
