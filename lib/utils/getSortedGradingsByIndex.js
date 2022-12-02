export default function rearrangeDepths(gradings) {
    const groups = new Map();
    gradings.forEach(item => {
        if (!groups.has(item.group)) {
            groups.set(item.group, []);
        }
        groups.get(item.group).push({ index: item.index, depth: item.depth, group: item.group });
    });
    const result = [];
    groups.forEach(groupGradings => {
        groupGradings.sort((a, b) => a.index - b.index);
        groupGradings.forEach((item, i) => {
            result.push({ index: item.index, depth: i, group: item.group });
        });
    });
    result.sort((a, b) => a.index - b.index);
    return result;
}
//# sourceMappingURL=getSortedGradingsByIndex.js.map