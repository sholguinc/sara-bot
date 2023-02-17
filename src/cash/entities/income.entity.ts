import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import { User } from '../../users/entities/user.entity';
import { currentTime, dateToString, getTimestamp } from '../../utils';

@Entity({ name: 'incomes' })
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  concept: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({
    name: 'transaction_date',
    type: 'varchar',
    length: 50,
  })
  transactionDate: string;

  @Index()
  @Column({ type: 'bigint' })
  timestamp: string;

  @Exclude()
  @ManyToOne(() => User, (user) => user.incomes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Expose()
  get username() {
    if (this.user) {
      return this.user.username;
    } else {
      return null;
    }
  }

  @BeforeInsert()
  setDate() {
    const datetime = currentTime();
    this.transactionDate = dateToString(datetime);
    this.timestamp = getTimestamp(datetime);
  }
}
