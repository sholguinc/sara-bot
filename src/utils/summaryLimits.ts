import { Summary } from 'src/cash/models/summary.model';
import { currentTime, subtractDays } from './datetime';

export function getLimits(summary: Summary) {
  // Limits
  let lowerLimit, upperLimit;

  // Datetime
  const datetime = currentTime();

  // Summary
  const commonSummary = [
    Summary.TODAY,
    Summary.WEEK,
    Summary.MONTH,
    Summary.YEAR,
  ];
  if (commonSummary.includes(summary)) {
    // Variables
    const dateInit = datetime.startOf(summary);

    lowerLimit = dateInit.toMillis();
    upperLimit = datetime.toMillis();
  } else if (summary == Summary.YESTERDAY) {
    // Variables
    const dayInit = datetime.startOf('day');
    const prevDayInit = subtractDays(datetime, 1);

    lowerLimit = prevDayInit.toMillis();
    upperLimit = dayInit.toMillis();
  } else if (summary == Summary.RECENT) {
    // Variables
    const dateInit = subtractDays(datetime, 7).startOf('day');

    lowerLimit = dateInit.toMillis();
    upperLimit = datetime.toMillis();
  }
  return { lowerLimit, upperLimit };
}
