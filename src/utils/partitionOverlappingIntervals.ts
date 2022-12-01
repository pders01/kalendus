/** This is an implementation of the sweep-line algorithm
 *  Ref: https://www.baeldung.com/cs/finding-all-overlapping-intervals \
 *  Example: https://stackoverflow.com/questions/30472556/how-to-find-all-overlapping-ranges-and-partition-them-into-chunks
 */

export default function partitionOverlappingIntervals(intervals: Interval[]) {
  const rightEndValues = intervals
    .map((value: {end: number}) => value.end)
    .sort((a: number, b: number) => a - b);
  intervals.sort(
    (a: {start: number; end: number}, b: {start: number; end: number}) =>
      a.start - b.start
  );

  let i = 0;
  let j = 0;
  let active = 0;

  const groups = [];
  let current = [];

  // eslint-disable-next-line no-constant-condition
  while (!(i >= intervals.length || j >= intervals.length)) {
    if (i < intervals.length && intervals[i].start < rightEndValues[j]) {
      current.push(intervals[i++]);
      ++active;
    } else if (j < intervals.length) {
      ++j;
      if (--active === 0) {
        groups.push(current);
        current = [];
      }
    }
  }
  return groups;
}
