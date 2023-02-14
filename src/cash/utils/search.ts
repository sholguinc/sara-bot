import { Markup } from 'telegraf';
import { capitalize, chunkArray } from 'src/utils';

export interface Search {
  likeName: boolean;
  minPrice: boolean;
  maxPrice: boolean;
}

// Search Buttons
export function searchButtons() {
  const buttonNames = ['minPrice', 'maxPrice', 'likeName'];

  const buttonArray = buttonNames.map((buttonName) => {
    return Markup.button.callback(
      capitalize(buttonName),
      `criterion:${buttonName}`,
    );
  });

  const buttons = chunkArray(buttonArray, 2).reverse() as any[];

  const continueButton = Markup.button.callback('➡️Continue', 'continueSearch');

  buttons.push([continueButton, cancelButton]);

  return buttons;
}

// Message
export function searchMessage(search: Search) {
  const base = 'Choose filters search criteria:';

  const keys = Object.keys(search);

  const criteria = keys.filter((item) => {
    return search[item];
  });

  const criteriaMessage = criteria.map((criterion) => {
    return `-> ${criterion}`;
  });

  const message = base + '\n\n' + criteriaMessage.join('\n');
  return { message, criteria };
}

// Cancel Button
const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
