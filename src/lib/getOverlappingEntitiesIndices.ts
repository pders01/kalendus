import partitionOverlappingIntervals from './partitionOverlappingIntervals.js';

export default function getOverlappingEntitiesIndices(
    partitions: Array<Interval[]>,
): Array<Grading> {
    // First we determine all non-overlapping partitions and save their indices.
    // Indices go into the index portion of the resolving objects and we add
    // a depth of 0 to indicate, that this is a full-width element.
    const accumulator = getNonOverlappingPartitions(partitions);

    // Then we filter the non-overlapping partitions out
    const overlappingPartitions = filterOverlappingPartitions(partitions);

    recursiveReduce(overlappingPartitions, accumulator);

    return accumulator.sort((a, b) => a.index - b.index);
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

function partitionReducer(
    accumulator: Array<Grading>,
    partition: Array<Partition>,
    depth: number,
    currentGroup?: number,
): Grading[] {
    const { group } = partition[0];

    if (currentGroup !== group) {
        depth = 0; // Reset depth when the group changes
        currentGroup = group;
    }

    const delta = partition.map(({ start, end }: Partition) => end - start);
    const maxDelta = Math.max(...delta);
    const indexMaxDelta = delta.indexOf(maxDelta);

    {
        const { index, group } = partition[indexMaxDelta];
        if (index === undefined || group === undefined) {
            throw Error(
                `Error in partition reduction with args: ${JSON.stringify(
                    partition[indexMaxDelta],
                )}`,
            );
        }

        accumulator.push({
            index,
            depth,
            group,
        });
    }

    partition.splice(delta.indexOf(maxDelta), 1);

    return recursiveReduce(
        partitionOverlappingIntervals(partition),
        accumulator,
        depth + 1,
        currentGroup,
    );
}

function recursiveReduce(
    partitions: Array<Partition[]>,
    accumulator: Array<Grading>,
    depth = 0,
    currentGroup?: number,
): Grading[] {
    if (partitions.length === 0) {
        return accumulator;
    }

    const [currentPartition, ...remainingPartitions] = partitions;
    const updatedAccumulator = partitionReducer(
        accumulator,
        currentPartition,
        depth,
    );

    return recursiveReduce(
        remainingPartitions,
        updatedAccumulator,
        depth + 1,
        currentGroup,
    );
}
