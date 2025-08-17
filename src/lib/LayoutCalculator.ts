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
        // Advanced grading system that properly handles overlap direction and z-indexing
        const grading: Array<{index: number, depth: number, group: number}> = [];
        
        // Step 1: Find all overlap groups
        const groups = this.findOverlapGroups(intervals);
        
        // Step 2: For each group, assign depths based on start time and duration
        groups.forEach((groupIndices, groupId) => {
            if (groupIndices.length === 1) {
                // Single event - no overlap
                grading.push({ index: groupIndices[0], depth: 0, group: groupId });
            } else {
                // Multiple overlapping events - assign depths intelligently
                const groupIntervals = groupIndices.map(i => ({ ...intervals[i], originalIndex: i }));
                
                // Sort by start time, then by duration (longer events go behind)
                groupIntervals.sort((a, b) => {
                    if (a.start !== b.start) return a.start - b.start;
                    return (b.end - b.start) - (a.end - a.start); // Longer events first (lower z-index)
                });
                
                // Assign depths using a greedy algorithm
                const assigned = this.assignDepthsGreedy(groupIntervals);
                assigned.forEach(({ originalIndex, depth }) => {
                    grading.push({ index: originalIndex, depth, group: groupId });
                });
            }
        });
        
        // Sort by original index to maintain order
        grading.sort((a, b) => a.index - b.index);
        return grading;
    }

    private findOverlapGroups(intervals: Array<{start: number, end: number}>): Array<number[]> {
        const groups: Array<number[]> = [];
        const assigned = new Set<number>();
        
        intervals.forEach((interval, index) => {
            if (assigned.has(index)) return;
            
            // Start a new group
            const group = [index];
            assigned.add(index);
            
            // Find all intervals that overlap with any interval in this group
            let changed = true;
            while (changed) {
                changed = false;
                intervals.forEach((otherInterval, otherIndex) => {
                    if (assigned.has(otherIndex)) return;
                    
                    // Check if this interval overlaps with any in the current group
                    const overlapsWithGroup = group.some(groupIndex => 
                        this.intervalsOverlap(intervals[groupIndex], otherInterval)
                    );
                    
                    if (overlapsWithGroup) {
                        group.push(otherIndex);
                        assigned.add(otherIndex);
                        changed = true;
                    }
                });
            }
            
            groups.push(group);
        });
        
        return groups;
    }

    private assignDepthsGreedy(groupIntervals: Array<{start: number, end: number, originalIndex: number}>): Array<{originalIndex: number, depth: number}> {
        const result: Array<{originalIndex: number, depth: number}> = [];
        const layers: Array<{start: number, end: number}[]> = [];
        
        groupIntervals.forEach(interval => {
            // Find the first layer where this interval can fit
            let assignedLayer = -1;
            
            for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
                const layer = layers[layerIndex];
                const canFit = !layer.some(existing => this.intervalsOverlap(interval, existing));
                
                if (canFit) {
                    assignedLayer = layerIndex;
                    break;
                }
            }
            
            // If no existing layer can fit this interval, create a new one
            if (assignedLayer === -1) {
                assignedLayer = layers.length;
                layers.push([]);
            }
            
            layers[assignedLayer].push(interval);
            result.push({ originalIndex: interval.originalIndex, depth: assignedLayer });
        });
        
        return result;
    }

    private intervalsOverlap(a: {start: number, end: number}, b: {start: number, end: number}): boolean {
        return a.start < b.end && b.start < a.end;
    }

    private calculateBoxes(events: CalendarEvent[], grading: Array<{index: number, depth: number, group: number}>): LayoutBox[] {
        // Group events by their overlap group to calculate optimal widths
        const eventsByGroup = new Map<number, Array<{event: CalendarEvent, index: number, grade: {index: number, depth: number, group: number}}>>();
        
        events.forEach((event, index) => {
            const grade = grading[index] || { depth: 0, group: index };
            if (!eventsByGroup.has(grade.group)) {
                eventsByGroup.set(grade.group, []);
            }
            eventsByGroup.get(grade.group)!.push({ event, index, grade });
        });

        return events.map((event, index) => {
            const grade = grading[index] || { depth: 0, group: index };
            const startMinute = event.startTime.hour * 60 + event.startTime.minute;
            const endMinute = event.endTime.hour * 60 + event.endTime.minute;
            const duration = endMinute - startMinute;
            
            const groupEvents = eventsByGroup.get(grade.group) || [];
            const maxDepthInGroup = Math.max(...groupEvents.map(g => g.grade.depth));
            
            // Calculate intelligent width allocation and positioning - cascading approach
            let width: number;
            let x: number;
            
            if (groupEvents.length === 1) {
                // Single event in group - use full width
                width = 100; // Percentage
                x = 0; // Relative position (percentage)
            } else {
                // Multiple overlapping events - use cascading layout for narrow viewports
                const totalEvents = maxDepthInGroup + 1;
                
                // Calculate offset based on depth
                const baseOffset = Math.min(12, Math.floor(60 / totalEvents)); // Responsive offset
                const offsetX = grade.depth * baseOffset;
                
                // Width calculation: ensure minimum readable width
                const minReadableWidth = 65; // Minimum 65% for good readability
                const maxOffset = Math.min(offsetX, 100 - minReadableWidth);
                
                x = maxOffset;
                width = 100 - maxOffset; // Width shrinks as we cascade right
                
                // Special case: if depth 0 (background event), it should fill more space
                if (grade.depth === 0) {
                    width = 100; // Background events always get full width
                    x = 0;
                }
            }
            
            // Z-index: background events (depth 0) should be BEHIND overlapping events
            // Higher depth = higher z-index (overlapping events on top)
            const baseZIndex = 100;
            const zIndex = baseZIndex + grade.depth; // Depth 0 gets lowest z-index, overlapping events get higher
            
            return {
                id: event.id,
                x: x, // Store as percentage
                y: startMinute * this.config.minuteHeight,
                width: width, // Store as percentage
                height: Math.max(duration * this.config.minuteHeight, this.config.eventMinHeight),
                depth: grade.depth,
                group: grade.group,
                opacity: grade.depth === 0 ? 0.95 : Math.max(0.85, 0.95 - (grade.depth * 0.05)),
                zIndex: zIndex
            };
        });
    }

    private calculateLabels(events: CalendarEvent[], boxes: LayoutBox[]): TextLabel[] {
        return events.map((event, index) => {
            const box = boxes[index];
            const timeStr = `${String(event.startTime.hour).padStart(2, '0')}:${String(event.startTime.minute).padStart(2, '0')}`;
            
            // Position text WITHIN each event's allocated space to avoid overlaps
            // Text should be positioned relative to the event's own box, not floating
            const textX = box.x + 2; // Small offset within the box
            const textY = box.y + 5; // Position inside the box, not above it
            
            return {
                id: event.id,
                content: event.heading,
                timeStr,
                x: textX,
                y: textY,
                color: event.color,
                visible: true
            };
        });
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