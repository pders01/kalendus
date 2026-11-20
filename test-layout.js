/**
 * Preview layout scenarios using the same calculator and ASCII renderer as the tests.
 * Run with: bun test-layout.js (or node test-layout.js on Node 22+)
 */
if (!process.versions.bun) {
    // Resolve the source tree's .js import specifiers to TypeScript under Node.
    const { register } = await import('node:module');
    register('ts-node/esm', import.meta.url);
}
const { LayoutCalculator } = await import('./src/lib/LayoutCalculator.js');
const { ASCIIRenderer } = await import('./src/lib/debug/ASCIIRenderer.js');

// Complex test scenarios - real-world overlapping patterns
const testScenarios = {
    simple: [
        {
            id: '1',
            heading: 'Meeting A',
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 10, minute: 0 },
            color: '#1976d2',
        },
        {
            id: '2',
            heading: 'Call B',
            startTime: { hour: 11, minute: 0 },
            endTime: { hour: 12, minute: 0 },
            color: '#388e3c',
        },
    ],

    partialOverlap: [
        {
            id: '1',
            heading: 'Strategy Meeting',
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 10, minute: 30 },
            color: '#1976d2',
        },
        {
            id: '2',
            heading: 'Client Call',
            startTime: { hour: 10, minute: 0 },
            endTime: { hour: 11, minute: 0 },
            color: '#388e3c',
        },
        {
            id: '3',
            heading: 'Code Review',
            startTime: { hour: 10, minute: 45 },
            endTime: { hour: 11, minute: 30 },
            color: '#f57c00',
        },
    ],

    completeOverlap: [
        {
            id: '1',
            heading: 'All Hands',
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 10, minute: 0 },
            color: '#1976d2',
        },
        {
            id: '2',
            heading: 'Team Sync',
            startTime: { hour: 9, minute: 15 },
            endTime: { hour: 9, minute: 45 },
            color: '#388e3c',
        },
        {
            id: '3',
            heading: 'Quick Chat',
            startTime: { hour: 9, minute: 30 },
            endTime: { hour: 9, minute: 40 },
            color: '#f57c00',
        },
    ],

    cascadingOverlaps: [
        {
            id: '1',
            heading: 'Workshop',
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 12, minute: 0 },
            color: '#1976d2',
        },
        {
            id: '2',
            heading: 'Standup',
            startTime: { hour: 9, minute: 30 },
            endTime: { hour: 10, minute: 0 },
            color: '#388e3c',
        },
        {
            id: '3',
            heading: 'Interview',
            startTime: { hour: 10, minute: 15 },
            endTime: { hour: 11, minute: 15 },
            color: '#f57c00',
        },
        {
            id: '4',
            heading: 'Coffee',
            startTime: { hour: 10, minute: 45 },
            endTime: { hour: 11, minute: 0 },
            color: '#9c27b0',
        },
        {
            id: '5',
            heading: 'Demo',
            startTime: { hour: 11, minute: 30 },
            endTime: { hour: 12, minute: 30 },
            color: '#ff5722',
        },
    ],

    denseOverlaps: [
        {
            id: '1',
            heading: 'Sprint Planning',
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 10, minute: 0 },
            color: '#1976d2',
        },
        {
            id: '2',
            heading: 'Architecture Review',
            startTime: { hour: 9, minute: 15 },
            endTime: { hour: 10, minute: 15 },
            color: '#388e3c',
        },
        {
            id: '3',
            heading: 'Bug Triage',
            startTime: { hour: 9, minute: 30 },
            endTime: { hour: 10, minute: 30 },
            color: '#f57c00',
        },
        {
            id: '4',
            heading: 'Security Audit',
            startTime: { hour: 9, minute: 45 },
            endTime: { hour: 10, minute: 45 },
            color: '#9c27b0',
        },
        {
            id: '5',
            heading: 'Performance Review',
            startTime: { hour: 9, minute: 50 },
            endTime: { hour: 10, minute: 50 },
            color: '#ff5722',
        },
    ],
};

console.log('Layout Calculator Preview');
console.log('='.repeat(60));

const calculator = new LayoutCalculator();
const renderer = new ASCIIRenderer(70, 25, { minutesPerRow: 20 });
const clock = ({ hour, minute }) =>
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

for (const [scenarioName, events] of Object.entries(testScenarios)) {
    console.log(`\n\n🧪 Scenario: ${scenarioName.toUpperCase()}`);
    console.log('-'.repeat(40));

    const layout = calculator.calculateLayout(events);
    console.log(
        `Events: ${events.length}, Groups: ${new Set(layout.boxes.map((box) => box.group)).size}`,
    );
    console.log('\nVisualization:');
    console.log(renderer.render(layout));
    console.log('\nEvent Details:');
    layout.boxes.forEach(({ x, depth }, index) => {
        const { heading, startTime, endTime } = events[index];
        console.log(
            `${heading} (${clock(startTime)}–${clock(endTime)}) [x: ${x}%, depth: ${depth}]`,
        );
    });
}
