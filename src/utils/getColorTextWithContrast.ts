export default function getColorTextWithContrast(color: string) {
  let red = 0;
  let green = 0;
  let blue = 0;

  if (color) {
    const matches: RegExpMatchArray | null = color
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (_m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
      )
      .substring(1)
      .match(/.{2}/g);

    if (!matches) {
      // Return default background and text colors
      return ['rgb(255,255,255)', 'rgb(0,0,0)'];
    }

    [red, green, blue] = matches.map((x) => parseInt(x, 16));
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
