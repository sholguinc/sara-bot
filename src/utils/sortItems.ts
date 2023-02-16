// JavaScript program to merge two sorted arrays of items

import { Expense } from '../cash/entities/expense.entity';
import { Income } from '../cash/entities/income.entity';

export function mergeItems(expenses: Expense[], incomes: Income[]) {
  const items = [...expenses, ...incomes];
  return items.sort(sortItems);
}

function sortItems(firstItem, secondItem) {
  const firstDate = Number(firstItem.transactionDate);
  const secondDate = Number(secondItem.transactionDate);

  if (firstDate < secondDate) {
    return -1;
  }

  if (firstDate > secondDate) {
    return 1;
  }

  return 0;
}
