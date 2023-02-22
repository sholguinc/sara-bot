const { DateTime } = require('luxon')

function dateFromMillis(millis) {
  return DateTime.fromMillis(millis).setLocale('en-gb').toString();
}

function dateToString(date) {
  return date.toString();
}

const timestamp = 1676946666917;
const datetime = dateFromMillis(timestamp);
const transactionDate = dateToString(datetime);

console.log(timestamp);
console.log(datetime);
console.log(transactionDate);
