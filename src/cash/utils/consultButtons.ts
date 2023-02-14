import { Markup } from 'telegraf';

import { Type } from '../models/type.model';
import { Cash } from '../models/cash.model';
import { Summary } from '../models/summary.model';
import { capitalize } from '../../utils';
import { chunkArray } from '../../utils';

// Summary Buttons
enum SummaryEmojis {
  TODAY = '☀',
  YESTERDAY = '⏪',
  RECENT = '🕙',
  WEEK = '📅',
  MONTH = '🌙',
  YEAR = '🍷',
}

export function summaryButtons() {
  const summaryButtons = (
    Object.keys(Summary) as Array<keyof typeof Summary>
  ).map((key) => {
    const summaryType = Summary[key];
    const buttonText = SummaryEmojis[key].concat(' ', capitalize(summaryType));
    const buttonData = `summary:${summaryType}`;
    return Markup.button.callback(buttonText, buttonData);
  });

  return summaryButtons.concat(cancelButton);
}

// Type Buttons
export function typeButtons() {
  const detailsButton = Markup.button.callback(
    '📋 Details',
    `type:${Type.DETAILS}`,
  );
  const overallButton = Markup.button.callback(
    '💰 Overall',
    `type:${Type.OVERALL}`,
  );

  return [[detailsButton, overallButton], [cancelButton]];
}

// Cash Buttons
export function cashButtons() {
  const incomesButton = Markup.button.callback(
    '📈 Incomes',
    `cash:${Cash.INCOME}`,
  );
  const expensesButton = Markup.button.callback(
    '📉 Expenses',
    `cash:${Cash.EXPENSE}`,
  );
  const bothButton = Markup.button.callback('💸 Both', `cash:both`);

  return [[incomesButton, expensesButton], [bothButton], [cancelButton]];
}

// Cancel Button
const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
