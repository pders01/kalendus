/** This is an implementation of the sweep-line algorithm
 *  Ref: https://www.baeldung.com/cs/finding-all-overlapping-intervals
 *  Example: https://stackoverflow.com/questions/30472556/how-to-find-all-overlapping-ranges-and-partition-them-into-chunks
 */

/**
 * 
 * @param {Object[]} intervals - An array of interval objects with start and end properties, e.g. { start: number, end: number }.
 * @returns {Array} - Partitioned Array of of arrays of interval objects.
 */
export default function partitionOverlappingIntervals(intervals) {
  var rightEndValues = intervals.map((r) => r.end).sort((a, b) => a - b);
  intervals.sort((a, b) => a.start - b.start);

  let i = 0;
  let j = 0;
  let active = 0;

  let groups = [];
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
