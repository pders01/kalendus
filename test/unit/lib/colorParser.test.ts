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
