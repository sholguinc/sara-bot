import { FilterDto } from '../dto/filter.dto';
import { Between, FindOptionsWhere, ILike } from 'typeorm';
import { Summary } from '../models/summary.model';
import { getLimits } from './summaryLimits';
import { priceFilter } from './priceFilter';

export async function getWhereOptions(params: FilterDto) {
  const where: FindOptionsWhere<any> = {};

  const { likeName, summary = Summary.MONTH } = params;
  const { minPrice, maxPrice } = params;
  const { username } = params;

  // User Filter
  if (username) {
    await this.usersService.findOneByName(username);
    where.user = { username };
  }

  // Name Filter
  if (likeName) {
    where.concept = ILike(`%${likeName}%`);
  }

  // Date Filter
  const { lowerLimit, upperLimit } = getLimits(summary);
  where.timestamp = Between(lowerLimit, upperLimit);

  // Price Filter
  if (minPrice || maxPrice) {
    where.amount = priceFilter(minPrice, maxPrice);
  }

  return where;
}
