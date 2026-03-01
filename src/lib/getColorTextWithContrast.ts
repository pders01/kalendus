import { parseColor } from './colorParser.js';

/**
 * Calculates the text color and background color based on the given color.
 *
 * @param {string} color - The color to process (hex, rgb, hsl, or named CSS color).
 * @returns {[string, string]} An array containing the text color and background color.
 */
export default function getColorTextWithContrast(color?: string): [string, string] {
    const rgb = parseColor(color);

    if (!rgb) {
        return ['rgb(255,255,255)', 'rgb(0,0,0)'];
    }

    const [red, green, blue] = rgb;

    // Calculate brightness of randomized colour
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    // Calculate brightness of white and black text
    const lightText = (255 * 299 + 255 * 587 + 255 * 114) / 1000;
    const darkText = (0 * 299 + 0 * 587 + 0 * 114) / 1000;

    const backgroundColor = `rgb(${red},${green},${blue})`;
    const textColor =
        Math.abs(brightness - lightText) > Math.abs(brightness - darkText)
            ? 'rgb(255, 255, 255)'
            : 'rgb(0, 0, 0)';

    return [backgroundColor, textColor];
}
