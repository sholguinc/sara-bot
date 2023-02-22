import { Markup } from 'telegraf';
import { chunkArray } from 'src/utils';

export function passwordButtons() {
  const array = [...Array(9).keys()];
  const buttonArray = array.map((index) => {
    const number = 1 + index;
    return Markup.button.callback(number.toString(), `key:${number}`);
  });

  const cancelButton = Markup.button.callback('❌', 'cancel');
  const zeroButton = Markup.button.callback('0', 'key:0');
  const delButton = Markup.button.callback('⬅', 'key:del');

  buttonArray.push(delButton, zeroButton, cancelButton);

  return chunkArray(buttonArray, 3) as any[];
}
