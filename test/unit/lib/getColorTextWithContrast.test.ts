import { expect } from 'chai';
import getColorTextWithContrast from '../../../src/lib/getColorTextWithContrast.js';

describe('getColorTextWithContrast', () => {
    describe('hex color format handling', () => {
        it('should handle 6-digit hex colors', () => {
            const [bgColor, textColor] = getColorTextWithContrast('#FF0000');
            expect(bgColor).to.equal('rgb(255,0,0)');
            expect(textColor).to.equal('rgb(255, 255, 255)'); // Red background should get white text
        });

        it('should handle 3-digit hex colors', () => {
            const [bgColor, textColor] = getColorTextWithContrast('#F00');
            expect(bgColor).to.equal('rgb(255,0,0)');
            expect(textColor).to.equal('rgb(255, 255, 255)'); // Red background should get white text
        });

        it('should handle hex colors without #', () => {
            const [bgColor, textColor] = getColorTextWithContrast('FF0000');
            expect(bgColor).to.equal('rgb(255,0,0)');
            expect(textColor).to.equal('rgb(255, 255, 255)');
        });
    });

    describe('brightness calculations', () => {
        it('should return white text for dark backgrounds', () => {
            const darkColors = ['#000000', '#001234', '#220022', '#123456'];
            darkColors.forEach((color) => {
                const [, textColor] = getColorTextWithContrast(color);
                expect(textColor).to.equal(
                    'rgb(255, 255, 255)',
                    `Failed for color ${color}`,
                );
            });
        });

        it('should return black text for light backgrounds', () => {
            const lightColors = ['#FFFFFF', '#FFFFCC', '#CCCCCC', '#DEDEDE'];
            lightColors.forEach((color) => {
                const [, textColor] = getColorTextWithContrast(color);
                expect(textColor).to.equal(
                    'rgb(0, 0, 0)',
                    `Failed for color ${color}`,
                );
            });
        });

        it('should handle mid-brightness colors correctly', () => {
            // Yellow (#FFFF00) has high brightness
            const [, yellowText] = getColorTextWithContrast('#FFFF00');
            expect(yellowText).to.equal('rgb(0, 0, 0)');

            // Purple (#800080) has low brightness
            const [, purpleText] = getColorTextWithContrast('#800080');
            expect(purpleText).to.equal('rgb(255, 255, 255)');
        });
    });

    describe('rgb() color format handling', () => {
        it('should handle rgb() colors', () => {
            const [bgColor, textColor] = getColorTextWithContrast('rgb(255, 0, 0)');
            expect(bgColor).to.equal('rgb(255,0,0)');
            expect(textColor).to.equal('rgb(255, 255, 255)');
        });

        it('should handle rgba() colors', () => {
            const [bgColor, textColor] = getColorTextWithContrast('rgba(255, 255, 255, 0.5)');
            expect(bgColor).to.equal('rgb(255,255,255)');
            expect(textColor).to.equal('rgb(0, 0, 0)');
        });
    });

    describe('hsl() color format handling', () => {
        it('should handle hsl() colors', () => {
            const [bgColor, textColor] = getColorTextWithContrast('hsl(0, 100%, 50%)');
            expect(bgColor).to.equal('rgb(255,0,0)');
            expect(textColor).to.equal('rgb(255, 255, 255)');
        });

        it('should handle dark hsl() colors', () => {
            const [, textColor] = getColorTextWithContrast('hsl(240, 100%, 20%)');
            expect(textColor).to.equal('rgb(255, 255, 255)');
        });
    });

    describe('named color format handling', () => {
        it('should handle named colors', () => {
            const [bgColor, textColor] = getColorTextWithContrast('red');
            expect(bgColor).to.equal('rgb(255,0,0)');
            expect(textColor).to.equal('rgb(255, 255, 255)');
        });

        it('should handle light named colors', () => {
            const [, textColor] = getColorTextWithContrast('white');
            expect(textColor).to.equal('rgb(0, 0, 0)');
        });

        it('should handle dark named colors', () => {
            const [, textColor] = getColorTextWithContrast('navy');
            expect(textColor).to.equal('rgb(255, 255, 255)');
        });
    });

    describe('edge cases', () => {
        it('should handle undefined color', () => {
            const [bgColor, textColor] = getColorTextWithContrast();
            expect(bgColor).to.equal('rgb(255,255,255)');
            expect(textColor).to.equal('rgb(0,0,0)');
        });

        it('should handle invalid color format', () => {
            const [bgColor, textColor] =
                getColorTextWithContrast('not-a-color');
            expect(bgColor).to.equal('rgb(255,255,255)');
            expect(textColor).to.equal('rgb(0,0,0)');
        });

        it('should handle empty string', () => {
            const [bgColor, textColor] = getColorTextWithContrast('');
            expect(bgColor).to.equal('rgb(255,255,255)');
            expect(textColor).to.equal('rgb(0,0,0)');
        });
    });
});
