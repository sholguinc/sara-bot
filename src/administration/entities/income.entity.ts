import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { currentTime, dateToString, getTimestamp } from '../../utils';

@Entity({ name: 'incomes' })
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  concept: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    name: 'transaction_date',
    type: 'varchar',
    length: 50,
  })
  transactionDate: string;

  @Column({ type: 'bigint' })
  timestamp: string;

  @ManyToOne(() => User, (user) => user.incomes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @BeforeInsert()
  setDate() {
    const datetime = currentTime();
    this.transactionDate = dateToString(datetime);
    this.timestamp = getTimestamp(datetime);
  }
}
