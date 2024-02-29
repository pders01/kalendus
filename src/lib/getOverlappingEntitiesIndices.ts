import partitionOverlappingIntervals from './partitionOverlappingIntervals.js';

/**
 * Calculates the indices and depths of overlapping entities within a set of partitions.
 *
 * @param {Array<Interval[]>} partitions - An array of partitions, where each partition is an array of intervals.
 * @returns {Array<Grading>} An array of grading objects, representing indices and depths of overlapping entities.
 */
export default function getOverlappingEntitiesIndices(
    partitions: Array<Interval[]>,
): Array<Grading> {
    // 1. Extract non-overlapping partitions
    const accumulator = getNonOverlappingPartitions(partitions);

    // 2. Isolate overlapping partitions for further processing
    const overlappingPartitions = filterOverlappingPartitions(partitions);

    // 3. Recursively process overlapping partitions to determine indices and depths
    recursiveReduce(overlappingPartitions, accumulator);

    // 4. Sort the final result by index
    return accumulator.sort((a, b) => a.index - b.index);
}

/**
 * Calculates the index of an entity within the flattened partitions.
 *
 * @param {Array<Interval[]>} partitions - The array of partitions.
 * @param {number} index - The index of the partition within the partitions array.
 * @returns {number} The calculated index of the entity.
 */
function calculateIndex(partitions: Array<Interval[]>, index: number): number {
    return [partitions.slice(0, index)].flatMap(
        (item) => item.flat().length,
    )[0];
}

/**
 * Extracts non-overlapping partitions and creates corresponding Grading objects.
 *
 * @param {Array<Interval[]>} partitions - The array of partitions.
 * @returns {Array<Grading>}  An array of Grading objects representing non-overlapping partitions.
 */
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

/**
 * Filters out partitions containing overlapping intervals.
 *
 * @param {Array<Interval[]>} partitions - The array of partitions.
 * @returns {Array<(Interval & Pick<Grading, 'index' | 'group'>)[]>} An array of partitions containing overlapping intervals (with index and group information).
 */
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

/**
 * Processes a single partition, updates the accumulator, and manages recursion for nested partitions.
 *
 * @param {Array<Grading>} accumulator - The accumulator to store results.
 * @param {Array<Partition>} partition -  The partition being processed.
 * @param {number} depth -  Current depth within the nested partitions.
 * @param {number} [currentGroup] - The group identifier for the current partition.
 * @returns {Array<Grading>} The updated accumulator.
 */
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

/**
 * Recursively processes partitions to calculate indices and depths of overlapping entities.
 *
 * @param {Array<Partition[]>} partitions - An array of partitions to process.
 * @param {Array<Grading>} accumulator - The accumulator for storing results.
 * @param {number} [depth=0] -  The initial depth value.
 * @param {number} [currentGroup] -  The initial group identifier.
 * @returns {Grading[]} The updated accumulator containing the calculated indices and depths.
 */
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
