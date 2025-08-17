/**
 * Test script for the layout calculator and ASCII renderer
 * Run with: node test-layout.js
 */

// Simple test implementation without TypeScript
class LayoutCalculator {
    constructor(config = {}) {
        this.config = {
            timeColumnWidth: 80,
            minuteHeight: 1,
            eventMinHeight: 20,
            cascadeOffset: 15,
            paddingLeft: 10,
            ...config
        };
    }

    calculateLayout(events) {
        const intervals = this.eventsToIntervals(events);
        const grading = this.calculateGrading(intervals);
        const boxes = this.calculateBoxes(events, grading);
        const labels = this.calculateLabels(events, boxes);
        
        return { boxes, labels, gridConfig: this.config };
    }

    eventsToIntervals(events) {
        return events.map(event => ({
            start: event.startTime.hour * 60 + event.startTime.minute,
            end: event.endTime.hour * 60 + event.endTime.minute
        }));
    }

    calculateGrading(intervals) {
        const grading = [];
        
        intervals.forEach((interval, index) => {
            let depth = 0;
            let group = index;
            
            for (let i = 0; i < index; i++) {
                const other = intervals[i];
                if (this.intervalsOverlap(interval, other)) {
                    depth++;
                    group = Math.min(group, i);
                }
            }
            
            grading.push({ index, depth, group });
        });
        
        return grading;
    }

    intervalsOverlap(a, b) {
        return a.start < b.end && b.start < a.end;
    }

    calculateBoxes(events, grading) {
        return events.map((event, index) => {
            const grade = grading[index] || { depth: 0, group: index };
            const startMinute = event.startTime.hour * 60 + event.startTime.minute;
            const endMinute = event.endTime.hour * 60 + event.endTime.minute;
            const duration = endMinute - startMinute;
            
            const cascadeReduction = grade.depth * this.config.cascadeOffset;
            const baseWidth = 200;
            
            return {
                id: event.id,
                x: this.config.timeColumnWidth + this.config.paddingLeft + cascadeReduction,
                y: startMinute * this.config.minuteHeight,
                width: baseWidth - cascadeReduction,
                height: Math.max(duration * this.config.minuteHeight, this.config.eventMinHeight),
                depth: grade.depth,
                group: grade.group,
                opacity: grade.depth === 0 ? 1.0 : 0.85,
                zIndex: 100 - grade.depth
            };
        });
    }

    calculateLabels(events, boxes) {
        return events.map((event, index) => {
            const box = boxes[index];
            const timeStr = `${String(event.startTime.hour).padStart(2, '0')}:${String(event.startTime.minute).padStart(2, '0')}`;
            
            let labelY = box.y;
            if (box.depth > 0) {
                labelY = this.findLabelPosition(box, boxes, index);
            }
            
            return {
                id: event.id,
                content: event.heading,
                timeStr,
                x: box.x + 5,
                y: labelY - 20,
                color: event.color,
                visible: true
            };
        });
    }

    findLabelPosition(targetBox, allBoxes, targetIndex) {
        const labelHeight = 18;
        let testY = targetBox.y;
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            let collision = false;
            
            for (let i = 0; i < allBoxes.length; i++) {
                if (i === targetIndex) continue;
                
                const otherBox = allBoxes[i];
                const otherLabelY = otherBox.y - 20;
                
                if (Math.abs(testY - otherLabelY) < labelHeight && 
                    Math.abs(targetBox.x - otherBox.x) < 100) {
                    collision = true;
                    break;
                }
            }
            
            if (!collision) {
                return testY;
            }
            
            testY -= labelHeight + 2;
            attempts++;
        }
        
        return targetBox.y;
    }
}

class ASCIIRenderer {
    constructor(width = 80, height = 24) {
        this.width = width;
        this.height = height;
    }

    render(layout) {
        const grid = this.createGrid();
        this.renderTimeColumn(grid);
        this.renderBoxes(grid, layout.boxes);
        this.renderLabels(grid, layout.labels);
        return this.gridToString(grid);
    }

    createGrid() {
        return Array(this.height).fill(null).map(() => 
            Array(this.width).fill(' ')
        );
    }

    renderTimeColumn(grid) {
        for (let hour = 9; hour <= 17; hour++) {
            const row = (hour - 9) * 3; // 3 rows per hour for ASCII
            if (row < this.height) {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                for (let i = 0; i < Math.min(timeStr.length, 5); i++) {
                    if (i < this.width) {
                        grid[row][i] = timeStr[i];
                    }
                }
                if (6 < this.width) {
                    grid[row][6] = '|';
                }
            }
        }
    }

    renderBoxes(grid, boxes) {
        console.log('Debug: Rendering boxes', boxes);
        boxes.forEach((box, index) => {
            // Map from minute-based positioning to ASCII grid
            const startRow = Math.floor((box.y - 540) / 60) + 1; // 540 = 9:00 in minutes
            const endRow = Math.min(startRow + Math.max(Math.floor(box.height / 60), 1), this.height - 1);
            const startCol = Math.floor((box.x - 90) / 8) + 8; // Scale position after time column
            const endCol = Math.min(startCol + Math.floor(box.width / 15), this.width - 1);
            
            console.log(`Box ${index}: y=${box.y}, startRow=${startRow}, endRow=${endRow}, startCol=${startCol}, endCol=${endCol}`);
            
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
                        grid[row][col] = box.depth === 0 ? '█' : '▓';
                        console.log(`Placed character at row=${row}, col=${col}`);
                    } else {
                        console.log(`Out of bounds: row=${row}, col=${col}, height=${this.height}, width=${this.width}`);
                    }
                }
            }
        });
    }

    renderLabels(grid, labels) {
        // Create a separate section for labels to ensure they're all visible
        const labelSection = [];
        labelSection.push('');
        labelSection.push('Event Details:');
        labelSection.push('-'.repeat(40));
        
        labels.forEach((label, index) => {
            if (!label.visible) return;
            
            const depth = Math.floor((label.x - 95) / 15); // Calculate depth from position
            const indent = '  '.repeat(depth);
            const text = `${indent}${index + 1}. ${label.content} (${label.timeStr}) [depth: ${depth}]`;
            labelSection.push(text);
        });
        
        // Add the label section below the grid
        const gridHeight = this.height;
        labelSection.forEach((line, index) => {
            const row = gridHeight + index;
            for (let i = 0; i < line.length && i < this.width; i++) {
                // Extend grid if needed
                if (!grid[row]) grid[row] = Array(this.width).fill(' ');
                grid[row][i] = line[i];
            }
        });
    }

    gridToString(grid) {
        return grid.map(row => row.join('')).join('\n');
    }
}

// Complex test scenarios - real-world overlapping patterns
const testScenarios = {
    simple: [
        { id: '1', heading: 'Meeting A', startTime: { hour: 9, minute: 0 }, endTime: { hour: 10, minute: 0 }, color: '#1976d2' },
        { id: '2', heading: 'Call B', startTime: { hour: 11, minute: 0 }, endTime: { hour: 12, minute: 0 }, color: '#388e3c' }
    ],
    
    partialOverlap: [
        { id: '1', heading: 'Strategy Meeting', startTime: { hour: 9, minute: 0 }, endTime: { hour: 10, minute: 30 }, color: '#1976d2' },
        { id: '2', heading: 'Client Call', startTime: { hour: 10, minute: 0 }, endTime: { hour: 11, minute: 0 }, color: '#388e3c' },
        { id: '3', heading: 'Code Review', startTime: { hour: 10, minute: 45 }, endTime: { hour: 11, minute: 30 }, color: '#f57c00' }
    ],
    
    completeOverlap: [
        { id: '1', heading: 'All Hands', startTime: { hour: 9, minute: 0 }, endTime: { hour: 10, minute: 0 }, color: '#1976d2' },
        { id: '2', heading: 'Team Sync', startTime: { hour: 9, minute: 15 }, endTime: { hour: 9, minute: 45 }, color: '#388e3c' },
        { id: '3', heading: 'Quick Chat', startTime: { hour: 9, minute: 30 }, endTime: { hour: 9, minute: 40 }, color: '#f57c00' }
    ],
    
    cascadingOverlaps: [
        { id: '1', heading: 'Workshop', startTime: { hour: 9, minute: 0 }, endTime: { hour: 12, minute: 0 }, color: '#1976d2' },
        { id: '2', heading: 'Standup', startTime: { hour: 9, minute: 30 }, endTime: { hour: 10, minute: 0 }, color: '#388e3c' },
        { id: '3', heading: 'Interview', startTime: { hour: 10, minute: 15 }, endTime: { hour: 11, minute: 15 }, color: '#f57c00' },
        { id: '4', heading: 'Coffee', startTime: { hour: 10, minute: 45 }, endTime: { hour: 11, minute: 0 }, color: '#9c27b0' },
        { id: '5', heading: 'Demo', startTime: { hour: 11, minute: 30 }, endTime: { hour: 12, minute: 30 }, color: '#ff5722' }
    ],
    
    denseOverlaps: [
        { id: '1', heading: 'Sprint Planning', startTime: { hour: 9, minute: 0 }, endTime: { hour: 10, minute: 0 }, color: '#1976d2' },
        { id: '2', heading: 'Architecture Review', startTime: { hour: 9, minute: 15 }, endTime: { hour: 10, minute: 15 }, color: '#388e3c' },
        { id: '3', heading: 'Bug Triage', startTime: { hour: 9, minute: 30 }, endTime: { hour: 10, minute: 30 }, color: '#f57c00' },
        { id: '4', heading: 'Security Audit', startTime: { hour: 9, minute: 45 }, endTime: { hour: 10, minute: 45 }, color: '#9c27b0' },
        { id: '5', heading: 'Performance Review', startTime: { hour: 9, minute: 50 }, endTime: { hour: 10, minute: 50 }, color: '#ff5722' }
    ]
};

// Run comprehensive tests
console.log('Testing Layout Calculator with Complex Scenarios');
console.log('=' .repeat(60));

const calculator = new LayoutCalculator();
const renderer = new ASCIIRenderer(70, 25);

// Test all scenarios
Object.entries(testScenarios).forEach(([scenarioName, events]) => {
    console.log(`\n\n🧪 Testing: ${scenarioName.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    const layout = calculator.calculateLayout(events);
    
    console.log(`Events: ${events.length}, Groups: ${Math.max(...layout.boxes.map(b => b.group)) + 1}`);
    console.log('Box positions:', layout.boxes.map(b => `(x:${b.x}, depth:${b.depth})`).join(', '));
    
    console.log('\nVisualization:');
    console.log(renderer.render(layout));
});

console.log('\n\n✅ All tests completed!');