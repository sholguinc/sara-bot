import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BeforeInsert,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { File } from '../../files/entities/file.entity';
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

  @ManyToOne(() => File, (file) => file.expenses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'file_id' })
  file: File;

  @BeforeInsert()
  setDate() {
    const datetime = currentTime();
    this.transactionDate = dateToString(datetime);
    this.timestamp = getTimestamp(datetime);
  }
}
