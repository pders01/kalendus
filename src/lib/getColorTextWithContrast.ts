import { parseColor, type RGBTuple } from './colorParser.js';

/** WCAG 2 relative luminance of an opaque, gamut-clipped sRGB tuple. */
export function relativeLuminance(rgb: RGBTuple): number {
    const linear = rgb.map((channel) => {
        const s = Math.max(0, Math.min(255, channel)) / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(a: RGBTuple, b: RGBTuple): number {
    const x = relativeLuminance(a);
    const y = relativeLuminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Calculates the text color and background color based on the given color.
 *
 * Alpha is intentionally discarded by the parser; this selects for the returned
 * opaque background, NOT an unknown translucent/composed surface.
 * Unsupported colors fall back to white/black.
 * @returns {[string, string]} [opaque background color, contrasting text color].
 */
export default function getColorTextWithContrast(color?: string): [string, string] {
    const rgb = parseColor(color);

    if (!rgb) {
        return ['rgb(255,255,255)', 'rgb(0,0,0)'];
    }

    const [red, green, blue] = rgb;

    const backgroundColor = `rgb(${red},${green},${blue})`;
    const textColor =
        contrastRatio(rgb, [255, 255, 255]) > contrastRatio(rgb, [0, 0, 0])
            ? 'rgb(255, 255, 255)'
            : 'rgb(0, 0, 0)';

    return [backgroundColor, textColor];
}
