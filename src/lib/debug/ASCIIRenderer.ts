import type { LayoutResult } from '../LayoutCalculator.js';

export interface ASCIIRendererOptions {
    /** Midnight-relative origin shared by labels and boxes (default 09:00). */
    startMinute?: number;
    minutesPerRow?: number;
    /** Must match LayoutCalculator's minuteHeight. */
    minuteHeight?: number;
}

/** ASCII renderer for testing and debugging the production layout, not a second algorithm. */
export class ASCIIRenderer {
    private width: number;
    private height: number;
    private startMinute: number;
    private minutesPerRow: number;
    private minuteHeight: number;

    constructor(width = 80, height = 24, options: ASCIIRendererOptions = {}) {
        this.width = width;
        this.height = height;
        this.startMinute = options.startMinute ?? 9 * 60;
        this.minutesPerRow = options.minutesPerRow ?? 15;
        this.minuteHeight = options.minuteHeight ?? 1;
        if (
            !Number.isInteger(width) ||
            width < 7 ||
            !Number.isInteger(height) ||
            height < 1 ||
            !Number.isFinite(this.startMinute) ||
            this.startMinute < 0 ||
            this.startMinute >= 1440 ||
            !Number.isFinite(this.minutesPerRow) ||
            this.minutesPerRow <= 0 ||
            !Number.isFinite(this.minuteHeight) ||
            this.minuteHeight <= 0
        ) {
            throw new RangeError('Invalid ASCII renderer dimensions or scale');
        }
    }

    render(layout: LayoutResult): string {
        const grid = Array.from({ length: this.height }, () => Array<string>(this.width).fill(' '));
        for (let row = 0; row < this.height; row++) {
            const minute = this.startMinute + row * this.minutesPerRow;
            if (minute % 60 === 0 && minute < 1440) {
                const label = `${String(Math.floor(minute / 60)).padStart(2, '0')}:00|`;
                for (let col = 0; col < label.length; col++) grid[row][col] = label[col];
            }
        }
        for (const box of layout.boxes) {
            const origin = box.y / this.minuteHeight - this.startMinute;
            const startRow = Math.max(0, Math.floor(origin / this.minutesPerRow));
            const endRow = Math.min(
                this.height - 1,
                Math.ceil((origin + box.height / this.minuteHeight) / this.minutesPerRow) - 1,
            );
            const drawableWidth = this.width - 7;
            const startCol = 7 + Math.floor((box.x / 100) * drawableWidth);
            const endCol = Math.min(
                this.width - 1,
                7 + Math.ceil(((box.x + box.width) / 100) * drawableWidth) - 1,
            );
            for (let row = startRow; row <= endRow; row++) {
                for (let col = Math.max(7, startCol); col <= endCol; col++) {
                    grid[row][col] = box.depth === 0 ? '█' : '▓';
                }
            }
        }
        return grid.map((row) => row.join('')).join('\n');
    }
}
