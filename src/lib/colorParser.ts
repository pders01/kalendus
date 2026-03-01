/**
 * Pure-math CSS color parser. Handles hex, rgb(), hsl(), and CSS named colors.
 * No DOM dependency — works in both Node and browser environments.
 */

export type RGBTuple = [number, number, number];

// ── Named CSS colors (all 148 + transparent) ────────────────────────────
const NAMED_COLORS: Record<string, RGBTuple> = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50],
};

// ── Hex parser ──────────────────────────────────────────────────────────
function parseHex(input: string): RGBTuple | undefined {
    const hex = input.startsWith('#') ? input.slice(1) : input;
    let r: number, g: number, b: number;

    if (/^[a-f\d]{3}$/i.test(hex)) {
        // #rgb
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (/^[a-f\d]{4}$/i.test(hex)) {
        // #rgba — ignore alpha
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (/^[a-f\d]{6}$/i.test(hex)) {
        // #rrggbb
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else if (/^[a-f\d]{8}$/i.test(hex)) {
        // #rrggbbaa — ignore alpha
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else {
        return undefined;
    }

    if (isNaN(r!) || isNaN(g!) || isNaN(b!)) return undefined;
    return [r!, g!, b!];
}

// ── rgb()/rgba() parser ─────────────────────────────────────────────────
function parseRgb(input: string): RGBTuple | undefined {
    // Match both rgb() and rgba(), comma and space syntax
    const match = input.match(
        /^rgba?\(\s*([^\s,)]+)[\s,]+([^\s,)]+)[\s,]+([^\s,/)]+)/i,
    );
    if (!match) return undefined;

    const values = [match[1], match[2], match[3]].map((v) => {
        const trimmed = v.trim();
        if (trimmed.endsWith('%')) {
            return Math.round((parseFloat(trimmed) / 100) * 255);
        }
        return Math.round(parseFloat(trimmed));
    });

    if (values.some((v) => isNaN(v))) return undefined;
    return [clamp(values[0]), clamp(values[1]), clamp(values[2])];
}

// ── hsl()/hsla() parser ─────────────────────────────────────────────────
function parseHsl(input: string): RGBTuple | undefined {
    const match = input.match(
        /^hsla?\(\s*([^\s,)]+)[\s,]+([^\s,)]+)[\s,]+([^\s,/)]+)/i,
    );
    if (!match) return undefined;

    // Parse hue with unit support
    const hue = parseAngle(match[1].trim());
    const sat = parsePercent(match[2].trim());
    const lit = parsePercent(match[3].trim());

    if (isNaN(hue) || isNaN(sat) || isNaN(lit)) return undefined;

    return hslToRgb(hue, sat, lit);
}

function parseAngle(value: string): number {
    if (value.endsWith('deg')) return parseFloat(value);
    if (value.endsWith('grad')) return parseFloat(value) * 0.9;
    if (value.endsWith('rad')) return (parseFloat(value) * 180) / Math.PI;
    if (value.endsWith('turn')) return parseFloat(value) * 360;
    // Bare number = degrees
    return parseFloat(value);
}

function parsePercent(value: string): number {
    if (value.endsWith('%')) return parseFloat(value) / 100;
    // Allow 0-1 range without %
    return parseFloat(value);
}

function hslToRgb(h: number, s: number, l: number): RGBTuple {
    // Normalize hue to [0, 360)
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r: number, g: number, b: number;

    if (h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
}

function clamp(value: number): number {
    return Math.max(0, Math.min(255, value));
}

// ── Main exported functions ─────────────────────────────────────────────

/**
 * Parse any common CSS color string into an RGB tuple.
 * Returns `undefined` for invalid input or `transparent`.
 */
export function parseColor(input?: string): RGBTuple | undefined {
    if (!input || !input.trim()) return undefined;
    const trimmed = input.trim().toLowerCase();

    if (trimmed === 'transparent') return undefined;

    // 1. Try hex (with or without #)
    if (trimmed.startsWith('#') || /^[a-f\d]{3,8}$/i.test(trimmed)) {
        return parseHex(trimmed);
    }

    // 2. Try rgb()/rgba()
    if (trimmed.startsWith('rgb')) {
        return parseRgb(trimmed);
    }

    // 3. Try hsl()/hsla()
    if (trimmed.startsWith('hsl')) {
        return parseHsl(trimmed);
    }

    // 4. Named color lookup
    const named = NAMED_COLORS[trimmed];
    if (named) return [...named];

    return undefined;
}

const DEFAULT_ACCENT: RGBTuple = [25, 118, 210];

/**
 * Parse a CSS color string, returning a fallback if parsing fails.
 * Default fallback is Material Blue 700 `[25, 118, 210]`.
 */
export function parseColorWithDefault(
    input?: string,
    fallback: RGBTuple = DEFAULT_ACCENT,
): RGBTuple {
    return parseColor(input) ?? fallback;
}
