export default function getDateByMonthInDirection(date, direction) {
  if (direction === 'previous') {
    return date.month - 1 === 0
      ? { ...date, year: date.year - 1, month: 12 }
      : { ...date, month: date.month - 1 };
  }

  if (direction === 'next') {
    return date.month + 1 === 13
      ? { ...date, year: date.year + 1, month: 1 }
      : { ...date, month: date.month + 1 };
  }

  return date;
}