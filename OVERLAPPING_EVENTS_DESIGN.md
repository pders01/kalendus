# Overlapping Events Rendering System Design

## Current State Analysis

### Existing Components
1. **Grading System**: Uses `partitionOverlappingIntervals`, `getOverlappingEntitiesIndices`, `getSortedGradingsByIndex`
2. **CSS Grid Positioning**: Events positioned via `--start-slot` CSS variable 
3. **Cascading Visual Effects**: Width reduction, margin offsets, opacity changes based on depth
4. **Two-Layer Attempt**: Tried separating event boxes from text labels

### Current Problems
- Floating labels positioning is non-deterministic
- Layout calculations are scattered and inconsistent  
- No clear separation between layout logic and rendering
- Text positioning fails in complex overlap scenarios

## Proposed Solution: Deterministic Layout Engine

### Phase 1: Layout Calculation Engine

#### Core Data Structures
```typescript
interface LayoutCell {
  startMinute: number;
  endMinute: number;
  depth: number;
  group: number;
  width: number;
  marginLeft: number;
  opacity: number;
  zIndex: number;
}

interface TextLabel {
  content: string;
  time: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface LayoutResult {
  boxes: LayoutCell[];
  labels: TextLabel[];
  gridInfo: {
    timeColumnWidth: number;
    minuteHeight: number;
    totalWidth: number;
    totalHeight: number;
  };
}
```

#### Layout Algorithm Steps
1. **Interval Analysis**: Parse time intervals and detect overlaps
2. **Grid Positioning**: Calculate exact pixel positions for each event
3. **Cascading Layout**: Apply depth-based width/margin adjustments
4. **Label Positioning**: Find non-overlapping positions for text labels
5. **Collision Detection**: Ensure no visual conflicts

### Phase 2: ASCII Test Renderer

Create a text-based renderer that can visualize layouts for testing:

```
Time |  Event Boxes         | Text Labels
-----|---------------------|------------------
09:00| [████████████████]  | Meeting A (09:00)
09:15|   [██████████████]   | Call B (09:15)  
09:30|     [████████████]   | Review C (09:30)
09:45| [████████████████]  |
10:00|                     |
```

### Phase 3: Production Renderer

Build the actual HTML/CSS renderer using the deterministic calculations.

## Implementation Plan

### Step 1: Extract Current Logic
- Document existing grading algorithms
- Map current CSS positioning logic
- Identify all hardcoded layout values

### Step 2: Build Calculation Engine  
- Pure functions for layout calculations
- No DOM dependencies
- Comprehensive test coverage

### Step 3: ASCII Renderer
- Visual verification tool
- Edge case testing
- Layout debugging capabilities

### Step 4: Production Integration
- Replace ad-hoc positioning with calculated values
- Implement proper two-layer rendering
- Maintain existing visual hierarchy

## Success Criteria
- [ ] Deterministic layout calculations for any event set
- [ ] ASCII renderer can visualize complex overlaps
- [ ] Text labels never overlap with grid or each other
- [ ] All visual hierarchy preserved (opacity, depth, etc.)
- [ ] Performance comparable to current implementation