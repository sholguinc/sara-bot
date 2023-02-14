import { Injectable } from '@nestjs/common';

import { ExpensesService } from './expenses.service';
import { FilterDto } from '../dto/filter.dto';

import { localString } from '../../utils';

@Injectable()
export class SearchService {
  constructor(private readonly expensesService: ExpensesService) {
  }

  async getSearch(filter: FilterDto, criteriaMessage: string): Promise<string> {
    const expenses = await this.expensesService.findSome(filter);

    // Message
    const criteria = '_*Search criteria:*_' + '\n' + criteriaMessage;

    let resultsMessage;
    if (typeof expenses == 'string') {
      resultsMessage = expenses;
    } else {
      const resultsArray = expenses.map((expense) => {
        // Information
        const date = localString(expense.transactionDate);
        const amount = Number(expense.amount).toFixed(2);
        const concept = expense.concept;

        return date + ' -> ' + '-' + 'S/.' + amount + ' - ' + concept;
      });
      resultsMessage = resultsArray.join('\n');
    }

    const results = '_*Search results:*_' + '\n' + resultsMessage;

    return criteria + '\n\n' + results;
  }
}
