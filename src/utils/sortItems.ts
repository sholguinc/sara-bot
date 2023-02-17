// JavaScript program to merge two sorted arrays of items

import { Expense } from '../cash/entities/expense.entity';
import { Income } from '../cash/entities/income.entity';

export function mergeItems(expenses: Expense[], incomes: Income[]) {
  const items = [...expenses, ...incomes];
  return items.sort(sortItems);
}

export function sortItems(firstItem, secondItem) {
  const firstDate = Number(firstItem.timestamp);
  const secondDate = Number(secondItem.timestamp);

  if (firstDate < secondDate) {
    return -1;
  }

  if (firstDate > secondDate) {
    return 1;
  }

  return 0;
}
