export default function getColorTextWithContrast(
    color?: string,
): [string, string] {
    let red = 0;
    let green = 0;
    let blue = 0;

    // Return default colors for undefined, empty string, or whitespace
    if (!color || !color.trim()) {
        return ['rgb(255,255,255)', 'rgb(0,0,0)'];
    }
    // Check for empty or whitespace-only string
    // Add # if missing
    const normalizedColor = color.startsWith('#') ? color : `#${color}`;

    const matches: RegExpMatchArray | null = normalizedColor
        .replace(
            /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            (_m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`,
        )
        .substring(1)
        .match(/.{2}/g);

    if (!matches || matches.length !== 3) {
        // Return default background and text colors for invalid input
        return ['rgb(255,255,255)', 'rgb(0,0,0)'];
    }

    try {
        [red, green, blue] = matches.map((x) => parseInt(x, 16));
        if (isNaN(red) || isNaN(green) || isNaN(blue)) {
            return ['rgb(255,255,255)', 'rgb(0,0,0)'];
        }
    } catch {
        return ['rgb(255,255,255)', 'rgb(0,0,0)'];
    }

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
