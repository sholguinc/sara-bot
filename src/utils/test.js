const { DateTime, moment } = require('luxon');

const timezone = 'America/Lima';

function currentTime() {
  const timezoneDate = DateTime.now().setZone(timezone);
  return timezoneDate.;
}

console.log(currentTime());
// console.log(new Date());
