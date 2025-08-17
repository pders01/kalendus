// Debug script to test the LayoutCalculator with real-world scenarios
// and trace what's happening with width allocation

import { LayoutCalculator } from './src/lib/LayoutCalculator.ts';

console.log('🔍 Debugging LayoutCalculator with real scenarios...\n');

const calculator = new LayoutCalculator();

// Test scenarios that might be causing issues
const testScenarios = [
    {
        name: 'Simple overlap - long background with short overlap',
        events: [
            {
                id: '1',
                heading: 'Short Meeting',
                startTime: { hour: 9, minute: 30 },
                endTime: { hour: 10, minute: 0 },
                color: '#1976d2'
            },
            {
                id: '2', 
                heading: 'Long Workshop',
                startTime: { hour: 9, minute: 0 },
                endTime: { hour: 11, minute: 0 },
                color: '#388e3c'
            }
        ]
    },
    {
        name: 'Three events with complex overlaps',
        events: [
            {
                id: '1',
                heading: 'Meeting A',
                startTime: { hour: 9, minute: 0 },
                endTime: { hour: 10, minute: 0 },
                color: '#1976d2'
            },
            {
                id: '2',
                heading: 'Meeting B', 
                startTime: { hour: 9, minute: 15 },
                endTime: { hour: 11, minute: 0 },
                color: '#388e3c'
            },
            {
                id: '3',
                heading: 'Meeting C',
                startTime: { hour: 9, minute: 30 },
                endTime: { hour: 10, minute: 30 },
                color: '#f57c00'
            }
        ]
    },
    {
        name: 'Four events densely packed',
        events: [
            {
                id: '1',
                heading: 'Sprint Planning',
                startTime: { hour: 9, minute: 0 },
                endTime: { hour: 10, minute: 0 },
                color: '#1976d2'
            },
            {
                id: '2',
                heading: 'Architecture Review',
                startTime: { hour: 9, minute: 15 },
                endTime: { hour: 10, minute: 15 },
                color: '#388e3c'
            },
            {
                id: '3',
                heading: 'Bug Triage',
                startTime: { hour: 9, minute: 30 },
                endTime: { hour: 10, minute: 30 },
                color: '#f57c00'
            },
            {
                id: '4',
                heading: 'Security Audit',
                startTime: { hour: 9, minute: 45 },
                endTime: { hour: 10, minute: 45 },
                color: '#9c27b0'
            }
        ]
    }
];

testScenarios.forEach((scenario, index) => {
    console.log(`\n📊 Scenario ${index + 1}: ${scenario.name}`);
    console.log('=' .repeat(50));
    
    // Calculate durations for reference
    const eventDurations = scenario.events.map(event => {
        const duration = (event.endTime.hour * 60 + event.endTime.minute) - (event.startTime.hour * 60 + event.startTime.minute);
        return { id: event.id, heading: event.heading, duration };
    });
    
    console.log('\n📝 Event Durations:');
    eventDurations.forEach(event => {
        console.log(`  ${event.id}: ${event.heading} (${event.duration} minutes)`);
    });
    
    // Calculate layout
    const layout = calculator.calculateLayout(scenario.events);
    
    console.log('\n📐 Layout Results:');
    layout.boxes.forEach(box => {
        const event = scenario.events.find(e => e.id === box.id);
        const duration = eventDurations.find(e => e.id === box.id)?.duration;
        console.log(`  ${box.id}: ${event?.heading}`);
        console.log(`    Duration: ${duration} min | Depth: ${box.depth} | Group: ${box.group}`);
        console.log(`    Width: ${box.width}% | X: ${box.x}% | Z-Index: ${box.zIndex}`);
        
        // Highlight potential issues
        if (box.depth === 0 && box.width !== 100) {
            console.log(`    ⚠️  WARNING: Background event (depth 0) has width ${box.width}% instead of 100%!`);
        }
        if (box.depth === 0 && box.x !== 0) {
            console.log(`    ⚠️  WARNING: Background event (depth 0) has x=${box.x}% instead of 0%!`);
        }
        console.log('');
    });
    
    // Summary analysis
    const backgroundEvents = layout.boxes.filter(box => box.depth === 0);
    const overlappingEvents = layout.boxes.filter(box => box.depth > 0);
    
    console.log('📊 Analysis:');
    console.log(`  Background events (depth 0): ${backgroundEvents.length}`);
    console.log(`  Overlapping events: ${overlappingEvents.length}`);
    console.log(`  Groups: ${Math.max(...layout.boxes.map(b => b.group)) + 1}`);
    
    // Check for issues
    const problematicBackgroundEvents = backgroundEvents.filter(box => box.width !== 100 || box.x !== 0);
    if (problematicBackgroundEvents.length > 0) {
        console.log(`  ❌ ISSUES FOUND: ${problematicBackgroundEvents.length} background events with incorrect width/position!`);
        problematicBackgroundEvents.forEach(box => {
            const event = scenario.events.find(e => e.id === box.id);
            console.log(`    - ${box.id} (${event?.heading}): width=${box.width}%, x=${box.x}%`);
        });
    } else {
        console.log(`  ✅ All background events have correct width (100%) and position (x=0)`);
    }
});

console.log('\n🏁 Debug complete!');