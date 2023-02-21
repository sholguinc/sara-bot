import { DateTime } from 'luxon';

const timezone = process.env.TZ;

export function currentTime() {
  return DateTime.now().setZone(timezone);
}

export function subtractDays(date, days: number) {
  return date.minus({ days });
}

export function stringToDate(dateString: string) {
  return DateTime.fromISO(dateString);
}

export function dateToString(date): string {
  return date.toString();
}

export function getTimestamp(date): string {
  const timestamp = date.toMillis();
  return timestamp.toString();
}

export function dateFromMillis(millis) {
  return DateTime.fromMillis(millis).setLocale('en-gb').toLocaleString();
}

export function timestampToISODate(timestamp: string) {
  const timestampNumber = Number(timestamp);
  return DateTime.fromMillis(timestampNumber).setLocale('en-gb').toString();
}

export function localString(dateString: string) {
  const date = stringToDate(dateString);
  return date.setLocale('en-gb').toLocaleString();
}

export function getDateString(): string {
  const time = currentTime();
  return time.setLocale('en-gb').toLocaleString();
}

export function getHyphenDate() {
  const time = currentTime();
  return time.setLocale('en-gb').toFormat('dd-MM-yy');
}
