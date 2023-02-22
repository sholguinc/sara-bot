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

import {
  currentTime,
  dateToString,
  getTimestamp,
  timestampToISODate,
} from '../../utils';

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
  setIncomeDate() {
    let incomeDatetime;
    if (!this.timestamp) {
      incomeDatetime = currentTime();
      this.timestamp = getTimestamp(incomeDatetime);
      this.transactionDate = dateToString(incomeDatetime);
    } else if (!this.transactionDate) {
      this.transactionDate = timestampToISODate(this.timestamp);
    }
  }
}
