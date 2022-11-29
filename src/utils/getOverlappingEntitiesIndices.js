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
          },
        ]
        : [...accumulator],
    []
  );

  /** Then we filter the non-overlapping partitions out */
  const _partitions = partitions
    .map((partition, index) =>
      partition.map((item, _index) => ({ ...item, index: index + _index }))
    )
    .filter((partition) => partition.length > 1);

  /** For each of the remaining partitions we have to check how deeply they overlap.
   *  TODO: Add indictor for partition group; document...
   */
  let depth = 0;
  function recursiveBubbleSort({ partitions, recursive = false }) {
    depth = recursive ? (depth += 1) : 0;
    partitions.forEach((partition) => {
      const delta = [...partition.map(({ start, end }) => end - start)];
      const maxDelta = Math.max(...delta);

      result.push({ index: partition[delta.indexOf(maxDelta)].index, depth });

      partition.splice(delta.indexOf(maxDelta), 1);

      recursiveBubbleSort({
        partitions: partitionOverlappingIntervals(partition),
        recursive: true,
      });
    });
  }

  recursiveBubbleSort({ partitions: _partitions });
  // console.log(result.sort((a, b) => a.index - b.index));

  return result.sort((a, b) => a.index - b.index);
}
