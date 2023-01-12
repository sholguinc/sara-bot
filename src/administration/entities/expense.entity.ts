import { PrimaryGeneratedColumn, Column, Entity, BeforeInsert } from 'typeorm';

import { currentTime, dateToString, getTimestamp } from 'src/utils';

@Entity({ name: 'expenses' })
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
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

  @BeforeInsert()
  setDate() {
    const datetime = currentTime();
    this.transactionDate = dateToString(datetime);
    this.timestamp = getTimestamp(datetime);
  }
}
