import { expect } from 'chai';
import getColorTextWithContrast, { contrastRatio, relativeLuminance } from '../../../src/lib/getColorTextWithContrast.js';
import { parseColor } from '../../../src/lib/colorParser.js';

describe('getColorTextWithContrast', () => {
    for (const color of ['#FF0000', '#F00', 'FF0000', 'rgb(255, 0, 0)', 'hsl(0, 100%, 50%)', 'red']) {
        it(`chooses black on red for ${color} (5.25:1 rather than white at 4:1)`, () => {
            expect(getColorTextWithContrast(color)).to.deep.equal(['rgb(255,0,0)', 'rgb(0, 0, 0)']);
        });
    }
    for (const color of ['#000000', '#001234', '#220022', '#123456', 'navy', 'hsl(240, 100%, 20%)', '#800080']) {
        it(`chooses white for ${color}`, () => {
            expect(getColorTextWithContrast(color)[1]).to.equal('rgb(255, 255, 255)');
        });
    }
    for (const color of ['#FFFFFF', '#FFFFCC', '#CCCCCC', '#DEDEDE', '#FFFF00', 'white', 'rgba(255, 255, 255, 0.5)']) {
        it(`chooses black for ${color}`, () => {
            expect(getColorTextWithContrast(color)[1]).to.equal('rgb(0, 0, 0)');
        });
    }
    for (const color of [undefined, '', 'not-a-color', '__proto__', 'constructor', 'transparent']) {
        it(`uses white/black fallback for ${String(color)}`, () => {
            expect(getColorTextWithContrast(color)).to.deep.equal(['rgb(255,255,255)', 'rgb(0,0,0)']);
        });
    }
    it('uses linearized sRGB luminance and the WCAG contrast ratio', () => {
        expect(relativeLuminance([255, 255, 255])).to.be.closeTo(1, 1e-12);
        expect(relativeLuminance([0, 0, 0])).to.equal(0);
        expect(relativeLuminance([255, 0, 0])).to.be.closeTo(0.2126, 1e-12);
        expect(contrastRatio([0, 0, 0], [255, 255, 255])).to.equal(21);
    });
    it('selects a foreground above 4.5:1 across a 4096-color sRGB sample grid', () => {
        for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
            const [background, foreground] = getColorTextWithContrast(`rgb(${r},${g},${b})`);
            expect(contrastRatio(parseColor(background)!, parseColor(foreground)!)).to.be.at.least(4.5);
        }
    });
});
