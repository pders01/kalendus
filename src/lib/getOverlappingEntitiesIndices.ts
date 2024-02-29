import partitionOverlappingIntervals from './partitionOverlappingIntervals.js';

export default function getOverlappingEntitiesIndices(
    partitions: Array<Interval[]>,
): Array<Grading> {
    // First we determine all non-overlapping partitions and save their indices.
    // Indices go into the index portion of the resolving objects and we add
    // a depth of 0 to indicate, that this is a full-width element.
    const result = getNonOverlappingPartitions(partitions);

    // Then we filter the non-overlapping partitions out
    const overlappingPartitions = filterOverlappingPartitions(partitions);

    /** For each of the remaining partitions we have to check how deeply they overlap.
     *  TODO: Add indictor for partition group; document...
     */
    let depth = 0;
    let openGroup: number | undefined = Math.min(
        ...overlappingPartitions.map((partition) => partition[0].group),
    );
    function recursiveBubbleSort({
        partitions,
        isNested = false,
    }: {
        partitions: Array<Partition[]>;
        isNested?: boolean;
    }) {
        depth = isNested ? (depth += 1) : 0;
        partitions.forEach((partition: Array<Partition>) => {
            const { group } = partition[0];
            if (openGroup !== group) {
                depth = 0;
            }
            openGroup = group;

            const delta = partition.map(
                ({ start, end }: Partition) => end - start,
            );
            const maxDelta = Math.max(...delta);
            const indexMaxDelta: number = delta.indexOf(maxDelta);

            result.push({
                index: partition[indexMaxDelta].index as number,
                depth,
                group: partition[indexMaxDelta].group as number,
            });

            partition.splice(delta.indexOf(maxDelta), 1);

            recursiveBubbleSort({
                partitions: partitionOverlappingIntervals(partition),
                isNested: true,
            });
        });
    }

    recursiveBubbleSort({ partitions: overlappingPartitions });

    return result.sort((a, b) => a.index - b.index);
}

function calculateIndex(partitions: Array<Interval[]>, index: number): number {
    return [partitions.slice(0, index)].flatMap(
        (item) => item.flat().length,
    )[0];
}

function getNonOverlappingPartitions(
    partitions: Array<Interval[]>,
): Array<Grading> {
    return partitions.reduce(
        (accumulator: Grading[], partition, index: number) =>
            partition.length === 1
                ? [
                      ...accumulator,
                      {
                          index: calculateIndex(partitions, index),
                          depth: 0,
                          group: index,
                      },
                  ]
                : [...accumulator],
        [],
    );
}

function filterOverlappingPartitions(
    partitions: Array<Interval[]>,
): Array<(Interval & Pick<Grading, 'index' | 'group'>)[]> {
    return partitions
        .map((partition, index) =>
            partition.map((item, _index) => ({
                ...item,
                index: calculateIndex(partitions, index) + _index,
                group: index,
            })),
        )
        .filter((partition) => partition.length > 1);
}
