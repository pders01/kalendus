import type { LayoutResult } from '../LayoutCalculator.js';

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

        this.renderTimeColumn(grid);
        this.renderBoxes(grid, layout.boxes);

        return this.gridToString(grid);
    }

    private createGrid(): string[][] {
        return Array(this.height)
            .fill(null)
            .map(() => Array(this.width).fill(' '));
    }

    private renderTimeColumn(grid: string[][]): void {
        for (let hour = 9; hour <= 17; hour++) {
            const row = (hour - 9) * 4;
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

    private renderBoxes(grid: string[][], boxes: LayoutResult['boxes']): void {
        boxes.forEach((box) => {
            const startRow = Math.floor(box.y / 15);
            const endRow = Math.min(startRow + Math.floor(box.height / 15) + 1, this.height - 1);
            const startCol = Math.floor(box.x / 8) + 7;
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

    private gridToString(grid: string[][]): string {
        return grid.map((row) => row.join('')).join('\n');
    }
}
