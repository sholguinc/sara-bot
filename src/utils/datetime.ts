import { DateTime } from 'luxon';
import { DateTime } from '@types/luxon'

const timezone = process.env.TZ;

export function currentTime(): DateTime {
  return DateTime.now().setZone(timezone);
}

export function subtractDays(date: Date, days: number): Date {
  const pastDate = date.minus({ days });
  pastDate.setDate(pastDate.getDate() - days);
  return pastDate;
}

export function dateToString(date: Date): string {
  return date.toString();
}

export function stringToDatetime(dateString: string) {
  return DateTime
}
