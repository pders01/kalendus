/**
 * Deterministic layout calculation engine for overlapping calendar events
 * Separates layout logic from rendering concerns
 */

interface CalendarEvent {
    id: string;
    heading: string;
    startTime: { hour: number; minute: number };
    endTime: { hour: number; minute: number };
    color: string;
}

interface GridConfig {
    timeColumnWidth: number;    // Width of time column (typically 80px)
    minuteHeight: number;       // Height per minute (typically 1px)
    eventMinHeight: number;     // Minimum event height
    cascadeOffset: number;      // Horizontal cascade offset per depth (typically 15px)
    paddingLeft: number;        // Left padding in event column
}

interface LayoutBox {
    id: string;
    x: number;                  // Left position
    y: number;                  // Top position  
    width: number;              // Box width
    height: number;             // Box height
    depth: number;              // Overlap depth (0 = top)
    group: number;              // Overlap group
    opacity: number;            // Transparency level
    zIndex: number;             // Stacking order
}

interface TextLabel {
    id: string;
    content: string;
    timeStr: string;
    x: number;                  // Label position
    y: number;                  
    color: string;
    visible: boolean;           // Whether to show this label
}

interface LayoutResult {
    boxes: LayoutBox[];
    labels: TextLabel[];
    gridConfig: GridConfig;
}

export class LayoutCalculator {
    private config: GridConfig;

    constructor(config: Partial<GridConfig> = {}) {
        this.config = {
            timeColumnWidth: 80,
            minuteHeight: 1,
            eventMinHeight: 20,
            cascadeOffset: 15,
            paddingLeft: 10,
            ...config
        };
    }

    /**
     * Calculate complete layout for a set of events
     */
    calculateLayout(events: CalendarEvent[]): LayoutResult {
        // Step 1: Convert events to intervals for overlap detection
        const intervals = this.eventsToIntervals(events);
        
        // Step 2: Use existing grading algorithms to detect overlaps
        const grading = this.calculateGrading(intervals);
        
        // Step 3: Calculate box positions and dimensions
        const boxes = this.calculateBoxes(events, grading);
        
        // Step 4: Calculate text label positions
        const labels = this.calculateLabels(events, boxes);
        
        return {
            boxes,
            labels,
            gridConfig: this.config
        };
    }

    private eventsToIntervals(events: CalendarEvent[]): Array<{start: number, end: number}> {
        return events.map(event => ({
            start: event.startTime.hour * 60 + event.startTime.minute,
            end: event.endTime.hour * 60 + event.endTime.minute
        }));
    }

    private calculateGrading(intervals: Array<{start: number, end: number}>): Array<{index: number, depth: number, group: number}> {
        // Import and use existing grading functions
        // This is a simplified version - in production, import the actual functions
        const grading: Array<{index: number, depth: number, group: number}> = [];
        
        // Simple overlap detection for demonstration
        intervals.forEach((interval, index) => {
            let depth = 0;
            let group = index;
            
            // Count overlaps with previous intervals
            for (let i = 0; i < index; i++) {
                const other = intervals[i];
                if (this.intervalsOverlap(interval, other)) {
                    depth++;
                    group = Math.min(group, i); // Join the earliest overlapping group
                }
            }
            
            grading.push({ index, depth, group });
        });
        
        return grading;
    }

    private intervalsOverlap(a: {start: number, end: number}, b: {start: number, end: number}): boolean {
        return a.start < b.end && b.start < a.end;
    }

    private calculateBoxes(events: CalendarEvent[], grading: Array<{index: number, depth: number, group: number}>): LayoutBox[] {
        return events.map((event, index) => {
            const grade = grading[index] || { depth: 0, group: index };
            const startMinute = event.startTime.hour * 60 + event.startTime.minute;
            const endMinute = event.endTime.hour * 60 + event.endTime.minute;
            const duration = endMinute - startMinute;
            
            // Calculate cascading layout
            const cascadeReduction = grade.depth * this.config.cascadeOffset;
            const baseWidth = 200; // Base event width
            
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

    private calculateLabels(events: CalendarEvent[], boxes: LayoutBox[]): TextLabel[] {
        return events.map((event, index) => {
            const box = boxes[index];
            const timeStr = `${String(event.startTime.hour).padStart(2, '0')}:${String(event.startTime.minute).padStart(2, '0')}`;
            
            // For overlapping events (depth > 0), position labels to avoid collisions
            let labelY = box.y;
            if (box.depth > 0) {
                // Find a non-overlapping position for the label
                labelY = this.findLabelPosition(box, boxes, index);
            }
            
            return {
                id: event.id,
                content: event.heading,
                timeStr,
                x: box.x + 5, // Small offset from box edge
                y: labelY - 20, // Position above the box
                color: event.color,
                visible: true
            };
        });
    }

    private findLabelPosition(targetBox: LayoutBox, allBoxes: LayoutBox[], targetIndex: number): number {
        const labelHeight = 18;
        let testY = targetBox.y;
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            let collision = false;
            
            // Check for collisions with other labels in the same area
            for (let i = 0; i < allBoxes.length; i++) {
                if (i === targetIndex) continue;
                
                const otherBox = allBoxes[i];
                const otherLabelY = otherBox.y - 20;
                
                // Check if labels would overlap
                if (Math.abs(testY - otherLabelY) < labelHeight && 
                    Math.abs(targetBox.x - otherBox.x) < 100) {
                    collision = true;
                    break;
                }
            }
            
            if (!collision) {
                return testY;
            }
            
            // Try positioning the label higher
            testY -= labelHeight + 2;
            attempts++;
        }
        
        return targetBox.y; // Fallback to original position
    }
}

/**
 * ASCII renderer for testing and debugging layouts
 */
export class ASCIIRenderer {
    private width: number;
    private height: number;
    
    constructor(width = 80, height = 24) {
        this.width = width;
        this.height = height;
    }

    render(layout: LayoutResult): string {
        const grid = this.createGrid();
        
        // Render time column
        this.renderTimeColumn(grid);
        
        // Render event boxes
        this.renderBoxes(grid, layout.boxes);
        
        // Render text labels
        this.renderLabels(grid, layout.labels);
        
        return this.gridToString(grid);
    }

    private createGrid(): string[][] {
        return Array(this.height).fill(null).map(() => 
            Array(this.width).fill(' ')
        );
    }

    private renderTimeColumn(grid: string[][]): void {
        for (let hour = 9; hour <= 17; hour++) {
            const row = (hour - 9) * 4; // 4 rows per hour
            if (row < this.height) {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                for (let i = 0; i < timeStr.length && i < 5; i++) {
                    if (i < this.width) {
                        grid[row][i] = timeStr[i];
                    }
                }
                grid[row][5] = '|';
            }
        }
    }

    private renderBoxes(grid: string[][], boxes: LayoutBox[]): void {
        boxes.forEach(box => {
            const startRow = Math.floor(box.y / 15); // Scale down for ASCII
            const endRow = Math.min(startRow + Math.floor(box.height / 15) + 1, this.height - 1);
            const startCol = Math.floor(box.x / 8) + 7; // Scale and offset for time column
            const endCol = Math.min(startCol + Math.floor(box.width / 8), this.width - 1);
            
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
                        grid[row][col] = box.depth === 0 ? '█' : '▓';
                    }
                }
            }
        });
    }

    private renderLabels(grid: string[][], labels: TextLabel[]): void {
        labels.forEach(label => {
            if (!label.visible) return;
            
            const row = Math.floor(label.y / 15);
            const col = Math.floor(label.x / 8) + 7;
            const text = `${label.content} (${label.timeStr})`;
            
            if (row >= 0 && row < this.height) {
                for (let i = 0; i < text.length && col + i < this.width; i++) {
                    if (col + i >= 0) {
                        grid[row][col + i] = text[i];
                    }
                }
            }
        });
    }

    private gridToString(grid: string[][]): string {
        return grid.map(row => row.join('')).join('\n');
    }
}