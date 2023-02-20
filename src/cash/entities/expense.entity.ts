import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BeforeInsert,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import { File } from '../../files/entities/file.entity';

import {
  currentTime,
  dateFromMillis,
  dateToString,
  getTimestamp,
} from 'src/utils';

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

  @Exclude()
  @ManyToOne(() => File, (file) => file.expenses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'file_id' })
  file: File;

  @Expose()
  get filename() {
    if (this.file) {
      return this.file.name;
    } else {
      return null;
    }
  }

  @BeforeInsert()
  setExpenseDate() {
    let expenseDatetime;
    if (!this.timestamp) {
      expenseDatetime = currentTime();
      this.timestamp = getTimestamp(expenseDatetime);
      this.transactionDate = dateToString(expenseDatetime);
    } else if (!this.transactionDate) {
      expenseDatetime = dateFromMillis(this.timestamp);
      this.transactionDate = dateToString(expenseDatetime);
    }
  }
}
