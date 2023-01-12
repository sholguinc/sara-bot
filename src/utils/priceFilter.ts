import { Between, LessThan, MoreThan } from 'typeorm';

export function priceFilter(minPrice, maxPrice) {
  let filter;

  if (minPrice && maxPrice) {
    filter = Between(minPrice, maxPrice);
  } else if (minPrice) {
    filter = MoreThan(minPrice);
  } else if (maxPrice) {
    filter = LessThan(maxPrice);
  }

  return filter;
}
