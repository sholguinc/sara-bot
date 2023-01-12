import { Summary } from 'src/administration/models/summary.model';
import { currentTime } from './datetime';

export function getLimits(summary: Summary) {
  // Datetime
  const datetime = currentTime();
  const dayInit = datetime.startOf(summary);

  // Limits
  const lowerLimit = dayInit.toMillis();
  const upperLimit = datetime.toMillis();

  return { lowerLimit, upperLimit };
}
