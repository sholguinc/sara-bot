import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  Index,
  BeforeInsert,
  OneToMany,
} from 'typeorm';

import { Expense } from '../../cash/entities/expense.entity';
import { currentTime, dateToString, getTimestamp } from 'src/utils';

@Entity({ name: 'files' })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  date: string;

  @Index()
  @Column({ type: 'bigint' })
  timestamp: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  total: number;

  @OneToMany(() => Expense, (expense) => expense.file)
  expenses: Expense[];

  @BeforeInsert()
  setDate() {
    const datetime = currentTime();
    this.date = dateToString(datetime);
    this.timestamp = getTimestamp(datetime);
  }
}
