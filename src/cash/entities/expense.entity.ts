import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BeforeInsert,
  Index,
} from 'typeorm';

import { currentTime, dateToString, getTimestamp } from 'src/utils';

@Entity({ name: 'expenses' })
export class Expense {
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

  @BeforeInsert()
  setDate() {
    const datetime = currentTime();
    this.transactionDate = dateToString(datetime);
    this.timestamp = getTimestamp(datetime);
  }
}
