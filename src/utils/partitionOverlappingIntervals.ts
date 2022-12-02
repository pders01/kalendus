/** This is an implementation of the sweep-line algorithm
 *  Ref: https://www.baeldung.com/cs/finding-all-overlapping-intervals \
 *  Example: https://stackoverflow.com/questions/30472556/how-to-find-all-overlapping-ranges-and-partition-them-into-chunks
 */

 export default function partitionOverlappingIntervals(intervals: Interval[]) {
  const rightEndValues = intervals.map((r) => r.end).sort((a, b) => a - b);
  intervals.sort((a, b) => a.start - b.start);

  let i = 0;
  let j = 0;
  let active = 0;

  const groups = [];
  let cur = [];

  // eslint-disable-next-line no-constant-condition
  while (1) {
    if (i < intervals.length && intervals[i].start < rightEndValues[j]) {
      cur.push(intervals[i++]);
      ++active;
    } else if (j < intervals.length) {
      ++j;
      if (--active === 0) {
        groups.push(cur);
        cur = [];
      }
    } else break;
  }

  return groups;
}
