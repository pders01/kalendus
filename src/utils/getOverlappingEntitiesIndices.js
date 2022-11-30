import partitionOverlappingIntervals from './partitionOverlappingIntervals';

export default function getOverlappingEntitiesIndices(partitions) {
  /** First we determine all non-overlapping partitions and save their indices.
   *  Indices go into the index portion of the resolving objects and we add
   *  a depth of 0 to indicate, that this is a full-width element.
   */
  const result = partitions.reduce(
    (accumulator, partition, index) =>
      partition.length === 1
        ? [
          ...accumulator,
          {
            index: [partitions.slice(0, index)].flatMap(
              (item) => item.flat().length
            )[0],
            depth: 0,
            group: index,
          },
        ]
        : [...accumulator],
    []
  );

  /** Then we filter the non-overlapping partitions out */
  const _partitions = partitions
    .map((partition, index) =>
      partition.map((item, _index) => ({
        ...item,
        index:
          [partitions.slice(0, index)].flatMap(
            (item) => item.flat().length
          )[0] + _index,
        group: index,
      }))
    )
    .filter((partition) => partition.length > 1);

  /** For each of the remaining partitions we have to check how deeply they overlap.
   *  TODO: Add indictor for partition group; document...
   */
  let depth = 0;
  let openGroup = Math.min(
    ...[..._partitions.map((partition) => partition[0].group)]
  );
  function recursiveBubbleSort({ partitions, isNested = false }) {
    depth = isNested ? (depth += 1) : 0;
    partitions.forEach((partition) => {
      const { group } = partition[0];
      if (openGroup !== group) {
        depth = 0;
      }
      openGroup = group;

      const delta = [...partition.map(({ start, end }) => end - start)];
      const maxDelta = Math.max(...delta);

      result.push({
        index: partition[delta.indexOf(maxDelta)].index,
        depth,
        group: partition[delta.indexOf(maxDelta)].group,
      });

      partition.splice(delta.indexOf(maxDelta), 1);

      recursiveBubbleSort({
        partitions: partitionOverlappingIntervals(partition),
        isNested: true,
      });
    });
  }

  recursiveBubbleSort({ partitions: _partitions });

  return result.sort((a, b) => a.index - b.index);
}
