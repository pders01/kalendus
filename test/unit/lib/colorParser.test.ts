import { expect } from 'chai';
import { parseColor, parseColorWithDefault, type RGBTuple } from '../../../src/lib/colorParser.js';

describe('colorParser', () => {
    describe('parseColor – hex', () => {
        it('should parse 6-digit hex with #', () => {
            expect(parseColor('#FF0000')).to.deep.equal([255, 0, 0]);
            expect(parseColor('#00ff00')).to.deep.equal([0, 255, 0]);
            expect(parseColor('#0000FF')).to.deep.equal([0, 0, 255]);
        });

        it('should parse 3-digit hex with #', () => {
            expect(parseColor('#F00')).to.deep.equal([255, 0, 0]);
            expect(parseColor('#0f0')).to.deep.equal([0, 255, 0]);
            expect(parseColor('#00f')).to.deep.equal([0, 0, 255]);
        });

        it('should parse hex without #', () => {
            expect(parseColor('FF0000')).to.deep.equal([255, 0, 0]);
            expect(parseColor('abc')).to.deep.equal([170, 187, 204]);
        });

        it('should parse 8-digit hex (ignoring alpha)', () => {
            expect(parseColor('#FF000080')).to.deep.equal([255, 0, 0]);
            expect(parseColor('#00FF00FF')).to.deep.equal([0, 255, 0]);
        });

        it('should parse 4-digit hex (ignoring alpha)', () => {
            expect(parseColor('#F00A')).to.deep.equal([255, 0, 0]);
        });

        it('should be case-insensitive', () => {
            expect(parseColor('#aaBBcc')).to.deep.equal([170, 187, 204]);
            expect(parseColor('#AABBCC')).to.deep.equal([170, 187, 204]);
        });
    });

    describe('parseColor – rgb()/rgba()', () => {
        it('should parse comma syntax', () => {
            expect(parseColor('rgb(255, 0, 0)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('rgb(0,128,255)')).to.deep.equal([0, 128, 255]);
        });

        it('should parse space syntax', () => {
            expect(parseColor('rgb(255 0 0)')).to.deep.equal([255, 0, 0]);
        });

        it('should parse rgba() and ignore alpha', () => {
            expect(parseColor('rgba(255, 0, 0, 0.5)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('rgba(0 128 255 / 0.5)')).to.deep.equal([0, 128, 255]);
        });

        it('should parse percentage values', () => {
            expect(parseColor('rgb(100%, 0%, 0%)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('rgb(50%, 50%, 50%)')).to.deep.equal([128, 128, 128]);
        });

        it('should clamp out-of-range values', () => {
            expect(parseColor('rgb(300, -10, 0)')).to.deep.equal([255, 0, 0]);
        });
    });

    describe('parseColor – hsl()/hsla()', () => {
        it('should parse comma syntax', () => {
            expect(parseColor('hsl(0, 100%, 50%)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('hsl(120, 100%, 50%)')).to.deep.equal([0, 255, 0]);
            expect(parseColor('hsl(240, 100%, 50%)')).to.deep.equal([0, 0, 255]);
        });

        it('should parse space syntax', () => {
            expect(parseColor('hsl(0 100% 50%)')).to.deep.equal([255, 0, 0]);
        });

        it('should parse hsla() and ignore alpha', () => {
            expect(parseColor('hsla(0, 100%, 50%, 0.5)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('hsla(120 100% 50% / 0.5)')).to.deep.equal([0, 255, 0]);
        });

        it('should parse deg angle unit', () => {
            expect(parseColor('hsl(0deg, 100%, 50%)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('hsl(120deg, 100%, 50%)')).to.deep.equal([0, 255, 0]);
        });

        it('should parse rad angle unit', () => {
            // π rad ≈ 180° → cyan
            const result = parseColor('hsl(3.14159rad, 100%, 50%)');
            expect(result).to.not.be.undefined;
            // At 180°: cyan [0, 255, 255]
            expect(result![0]).to.be.closeTo(0, 1);
            expect(result![1]).to.be.closeTo(255, 1);
            expect(result![2]).to.be.closeTo(255, 1);
        });

        it('should parse turn angle unit', () => {
            // 0.5turn = 180° → cyan
            const result = parseColor('hsl(0.5turn, 100%, 50%)');
            expect(result).to.deep.equal([0, 255, 255]);
        });

        it('should parse grad angle unit', () => {
            // 200grad = 180° → cyan
            const result = parseColor('hsl(200grad, 100%, 50%)');
            expect(result).to.deep.equal([0, 255, 255]);
        });

        it('should handle achromatic colors (s=0)', () => {
            expect(parseColor('hsl(0, 0%, 0%)')).to.deep.equal([0, 0, 0]);
            expect(parseColor('hsl(0, 0%, 50%)')).to.deep.equal([128, 128, 128]);
            expect(parseColor('hsl(0, 0%, 100%)')).to.deep.equal([255, 255, 255]);
        });

        it('should handle lightness extremes', () => {
            // Any hue at l=0 is black
            expect(parseColor('hsl(120, 100%, 0%)')).to.deep.equal([0, 0, 0]);
            // Any hue at l=100% is white
            expect(parseColor('hsl(120, 100%, 100%)')).to.deep.equal([255, 255, 255]);
        });
    });

    describe('parseColor – hwb()', () => {
        it('should parse basic hwb() colors', () => {
            // hwb(0, 0%, 0%) = pure red
            expect(parseColor('hwb(0, 0%, 0%)')).to.deep.equal([255, 0, 0]);
            // hwb(120, 0%, 0%) = pure green (lime)
            expect(parseColor('hwb(120, 0%, 0%)')).to.deep.equal([0, 255, 0]);
            // hwb(240, 0%, 0%) = pure blue
            expect(parseColor('hwb(240, 0%, 0%)')).to.deep.equal([0, 0, 255]);
        });

        it('should parse space syntax', () => {
            expect(parseColor('hwb(0 0% 0%)')).to.deep.equal([255, 0, 0]);
        });

        it('should handle whiteness', () => {
            // hwb(0, 100%, 0%) = white
            expect(parseColor('hwb(0, 100%, 0%)')).to.deep.equal([255, 255, 255]);
        });

        it('should handle blackness', () => {
            // hwb(0, 0%, 100%) = black
            expect(parseColor('hwb(0, 0%, 100%)')).to.deep.equal([0, 0, 0]);
        });

        it('should normalize when w + b >= 1', () => {
            // hwb(0, 50%, 50%) = gray (w/(w+b) = 0.5)
            expect(parseColor('hwb(0, 50%, 50%)')).to.deep.equal([128, 128, 128]);
            // hwb(0, 75%, 75%) = same gray
            expect(parseColor('hwb(0, 75%, 75%)')).to.deep.equal([128, 128, 128]);
        });

        it('should handle angle units', () => {
            expect(parseColor('hwb(0deg, 0%, 0%)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('hwb(0.5turn, 0%, 0%)')).to.deep.equal([0, 255, 255]);
        });

        it('should handle alpha (ignoring it)', () => {
            expect(parseColor('hwb(0 0% 0% / 0.5)')).to.deep.equal([255, 0, 0]);
        });
    });

    describe('parseColor – lab()', () => {
        it('should parse black and white', () => {
            // lab(0, 0, 0) = black
            const black = parseColor('lab(0, 0, 0)');
            expect(black).to.not.be.undefined;
            expect(black![0]).to.be.closeTo(0, 1);
            expect(black![1]).to.be.closeTo(0, 1);
            expect(black![2]).to.be.closeTo(0, 1);

            // lab(100, 0, 0) = white
            const white = parseColor('lab(100, 0, 0)');
            expect(white).to.not.be.undefined;
            expect(white![0]).to.be.closeTo(255, 2);
            expect(white![1]).to.be.closeTo(255, 2);
            expect(white![2]).to.be.closeTo(255, 2);
        });

        it('should parse space syntax', () => {
            const result = parseColor('lab(50 0 0)');
            expect(result).to.not.be.undefined;
            // 50% lightness gray
            expect(result![0]).to.be.closeTo(result![1], 2);
            expect(result![1]).to.be.closeTo(result![2], 2);
        });

        it('should parse percentage lightness', () => {
            const result = parseColor('lab(50%, 0, 0)');
            expect(result).to.not.be.undefined;
            // 50% of 100 = L:50
            expect(result![0]).to.be.closeTo(119, 3);
        });

        it('should handle chromatic values', () => {
            // lab(50, 80, 0) = a reddish color
            const result = parseColor('lab(50, 80, 0)');
            expect(result).to.not.be.undefined;
            // Red channel should be dominant
            expect(result![0]).to.be.greaterThan(result![1]);
        });
    });

    describe('parseColor – oklab()', () => {
        it('should parse black and white', () => {
            // oklab(0, 0, 0) = black
            const black = parseColor('oklab(0, 0, 0)');
            expect(black).to.not.be.undefined;
            expect(black![0]).to.be.closeTo(0, 1);
            expect(black![1]).to.be.closeTo(0, 1);
            expect(black![2]).to.be.closeTo(0, 1);

            // oklab(1, 0, 0) = white
            const white = parseColor('oklab(1, 0, 0)');
            expect(white).to.not.be.undefined;
            expect(white![0]).to.be.closeTo(255, 2);
            expect(white![1]).to.be.closeTo(255, 2);
            expect(white![2]).to.be.closeTo(255, 2);
        });

        it('should parse space syntax', () => {
            const result = parseColor('oklab(0.5 0 0)');
            expect(result).to.not.be.undefined;
            // Neutral gray — all channels similar
            expect(result![0]).to.be.closeTo(result![1], 2);
            expect(result![1]).to.be.closeTo(result![2], 2);
        });

        it('should parse percentage lightness', () => {
            // 50% = L:0.5
            const result = parseColor('oklab(50%, 0, 0)');
            expect(result).to.not.be.undefined;
            expect(result![0]).to.be.closeTo(result![1], 2);
        });

        it('should handle chromatic values', () => {
            // Positive a = reddish, negative a = greenish
            const reddish = parseColor('oklab(0.6, 0.2, 0)');
            const greenish = parseColor('oklab(0.6, -0.2, 0)');
            expect(reddish).to.not.be.undefined;
            expect(greenish).to.not.be.undefined;
            expect(reddish![0]).to.be.greaterThan(greenish![0]); // more red
        });
    });

    describe('parseColor – oklch()', () => {
        it('should parse black and white', () => {
            // oklch(0, 0, 0) = black
            const black = parseColor('oklch(0, 0, 0)');
            expect(black).to.not.be.undefined;
            expect(black![0]).to.be.closeTo(0, 1);
            expect(black![1]).to.be.closeTo(0, 1);
            expect(black![2]).to.be.closeTo(0, 1);

            // oklch(1, 0, 0) = white
            const white = parseColor('oklch(1, 0, 0)');
            expect(white).to.not.be.undefined;
            expect(white![0]).to.be.closeTo(255, 2);
            expect(white![1]).to.be.closeTo(255, 2);
            expect(white![2]).to.be.closeTo(255, 2);
        });

        it('should parse space syntax', () => {
            const result = parseColor('oklch(0.5 0 0)');
            expect(result).to.not.be.undefined;
            expect(result![0]).to.be.closeTo(result![1], 2);
        });

        it('should parse with hue angles', () => {
            // Red-ish: oklch(0.6, 0.2, 30)
            const red = parseColor('oklch(0.6, 0.2, 30)');
            expect(red).to.not.be.undefined;
            expect(red![0]).to.be.greaterThan(red![2]); // R > B
        });

        it('should parse angle units', () => {
            // 180deg → greenish-cyan range
            const result = parseColor('oklch(0.7, 0.15, 180deg)');
            expect(result).to.not.be.undefined;
            expect(result![1]).to.be.greaterThan(result![0]); // G > R
        });

        it('should parse percentage lightness', () => {
            // 70% = L:0.7
            const result = parseColor('oklch(70%, 0, 0)');
            expect(result).to.not.be.undefined;
            expect(result![0]).to.be.closeTo(result![1], 2);
        });

        it('should handle zero chroma (achromatic)', () => {
            // Zero chroma = gray regardless of hue
            const gray1 = parseColor('oklch(0.5, 0, 0)');
            const gray2 = parseColor('oklch(0.5, 0, 180)');
            expect(gray1).to.not.be.undefined;
            expect(gray2).to.not.be.undefined;
            expect(gray1).to.deep.equal(gray2);
        });

        it('should handle alpha (ignoring it)', () => {
            const result = parseColor('oklch(0.5 0 0 / 0.5)');
            expect(result).to.not.be.undefined;
            expect(result![0]).to.be.closeTo(result![1], 2);
        });
    });

    describe('parseColor – lch()', () => {
        it('should parse black and white', () => {
            const black = parseColor('lch(0, 0, 0)');
            expect(black).to.not.be.undefined;
            expect(black![0]).to.be.closeTo(0, 1);

            const white = parseColor('lch(100, 0, 0)');
            expect(white).to.not.be.undefined;
            expect(white![0]).to.be.closeTo(255, 2);
            expect(white![1]).to.be.closeTo(255, 2);
            expect(white![2]).to.be.closeTo(255, 2);
        });

        it('should parse space syntax', () => {
            const result = parseColor('lch(50 0 0)');
            expect(result).to.not.be.undefined;
            expect(result![0]).to.be.closeTo(result![1], 2);
        });

        it('should handle hue angles', () => {
            // High chroma at ~0° hue = reddish
            const red = parseColor('lch(50, 80, 40)');
            expect(red).to.not.be.undefined;
            expect(red![0]).to.be.greaterThan(red![2]); // R > B
        });

        it('should handle zero chroma (achromatic)', () => {
            const gray1 = parseColor('lch(50, 0, 0)');
            const gray2 = parseColor('lch(50, 0, 270)');
            expect(gray1).to.deep.equal(gray2);
        });
    });

    describe('parseColor – color()', () => {
        it('should parse color(srgb ...)', () => {
            expect(parseColor('color(srgb 1 0 0)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('color(srgb 0 1 0)')).to.deep.equal([0, 255, 0]);
            expect(parseColor('color(srgb 0 0 1)')).to.deep.equal([0, 0, 255]);
        });

        it('should parse srgb with percentages', () => {
            expect(parseColor('color(srgb 100% 0% 0%)')).to.deep.equal([255, 0, 0]);
            expect(parseColor('color(srgb 50% 50% 50%)')).to.deep.equal([128, 128, 128]);
        });

        it('should parse color(xyz-d65 ...)', () => {
            // D65 white point: xyz(0.9505, 1.0, 1.0890)
            const white = parseColor('color(xyz-d65 0.9505 1.0 1.089)');
            expect(white).to.not.be.undefined;
            expect(white![0]).to.be.closeTo(255, 3);
            expect(white![1]).to.be.closeTo(255, 3);
            expect(white![2]).to.be.closeTo(255, 3);

            // Black
            const black = parseColor('color(xyz-d65 0 0 0)');
            expect(black).to.deep.equal([0, 0, 0]);
        });

        it('should parse color(xyz-d50 ...)', () => {
            const black = parseColor('color(xyz-d50 0 0 0)');
            expect(black).to.deep.equal([0, 0, 0]);

            // Near-white D50 reference
            const white = parseColor('color(xyz-d50 0.9642 1.0 0.8251)');
            expect(white).to.not.be.undefined;
            expect(white![0]).to.be.closeTo(255, 3);
            expect(white![1]).to.be.closeTo(255, 3);
            expect(white![2]).to.be.closeTo(255, 3);
        });

        it('should treat xyz as xyz-d65', () => {
            const d65 = parseColor('color(xyz-d65 0.5 0.5 0.5)');
            const xyz = parseColor('color(xyz 0.5 0.5 0.5)');
            expect(d65).to.deep.equal(xyz);
        });

        it('should return undefined for unsupported color spaces', () => {
            expect(parseColor('color(display-p3 1 0 0)')).to.be.undefined;
        });
    });

    describe('parseColor – MDN cross-reference (#bada55)', () => {
        // All formats for the same color should produce similar RGB values
        it('should produce consistent results across formats', () => {
            const expected = [186, 218, 85]; // #bada55
            const tolerance = 3;

            const formats = [
                '#bada55',
                'rgb(186 218 85)',
                'hsl(74 64% 59%)',
                'hwb(74 33% 14%)',
                'color(srgb 0.729 0.855 0.333)',
                'lab(82.773 -24.838 59.629)',
                'lch(82.773 64.596 112.614)',
                'oklab(0.83912 -0.08461 0.13835)',
                'oklch(0.83912 0.16217 121.44802)',
            ];

            for (const fmt of formats) {
                const result = parseColor(fmt);
                expect(result, `Failed for ${fmt}`).to.not.be.undefined;
                expect(result![0], `R mismatch for ${fmt}`).to.be.closeTo(expected[0], tolerance);
                expect(result![1], `G mismatch for ${fmt}`).to.be.closeTo(expected[1], tolerance);
                expect(result![2], `B mismatch for ${fmt}`).to.be.closeTo(expected[2], tolerance);
            }
        });
    });

    describe('parseColor – named colors', () => {
        it('should parse basic named colors', () => {
            expect(parseColor('red')).to.deep.equal([255, 0, 0]);
            expect(parseColor('green')).to.deep.equal([0, 128, 0]);
            expect(parseColor('blue')).to.deep.equal([0, 0, 255]);
            expect(parseColor('white')).to.deep.equal([255, 255, 255]);
            expect(parseColor('black')).to.deep.equal([0, 0, 0]);
        });

        it('should parse extended named colors', () => {
            expect(parseColor('cornflowerblue')).to.deep.equal([100, 149, 237]);
            expect(parseColor('rebeccapurple')).to.deep.equal([102, 51, 153]);
            expect(parseColor('tomato')).to.deep.equal([255, 99, 71]);
        });

        it('should be case-insensitive for named colors', () => {
            expect(parseColor('Red')).to.deep.equal([255, 0, 0]);
            expect(parseColor('BLUE')).to.deep.equal([0, 0, 255]);
            expect(parseColor('CornflowerBlue')).to.deep.equal([100, 149, 237]);
        });
    });

    describe('parseColor – edge cases', () => {
        it('should return undefined for undefined', () => {
            expect(parseColor(undefined)).to.be.undefined;
        });

        it('should return undefined for empty string', () => {
            expect(parseColor('')).to.be.undefined;
        });

        it('should return undefined for whitespace-only string', () => {
            expect(parseColor('   ')).to.be.undefined;
        });

        it('should return undefined for invalid strings', () => {
            expect(parseColor('not-a-color')).to.be.undefined;
            expect(parseColor('hello')).to.be.undefined;
            expect(parseColor('#xyz')).to.be.undefined;
        });

        it('should return undefined for transparent', () => {
            expect(parseColor('transparent')).to.be.undefined;
        });

        it('should handle leading/trailing whitespace', () => {
            expect(parseColor('  #FF0000  ')).to.deep.equal([255, 0, 0]);
            expect(parseColor('  red  ')).to.deep.equal([255, 0, 0]);
        });
    });

    describe('parseColorWithDefault', () => {
        it('should return parsed color for valid input', () => {
            expect(parseColorWithDefault('#FF0000')).to.deep.equal([255, 0, 0]);
            expect(parseColorWithDefault('red')).to.deep.equal([255, 0, 0]);
        });

        it('should return default accent for invalid input', () => {
            expect(parseColorWithDefault(undefined)).to.deep.equal([25, 118, 210]);
            expect(parseColorWithDefault('')).to.deep.equal([25, 118, 210]);
            expect(parseColorWithDefault('not-a-color')).to.deep.equal([25, 118, 210]);
        });

        it('should use custom fallback when provided', () => {
            const custom: RGBTuple = [100, 200, 50];
            expect(parseColorWithDefault('invalid', custom)).to.deep.equal([100, 200, 50]);
            expect(parseColorWithDefault(undefined, custom)).to.deep.equal([100, 200, 50]);
        });

        it('should not use fallback when input is valid', () => {
            const custom: RGBTuple = [100, 200, 50];
            expect(parseColorWithDefault('#FF0000', custom)).to.deep.equal([255, 0, 0]);
        });
    });
});
