import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const template = readFileSync(new URL('../../../docs/_includes/base.njk', import.meta.url), 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(template)![1];

// State/keyboard tests without requiring a browser install in the unit-test job.
// Real layout/focus visibility is separately verified with Chromium at 320/768px.
function setup(narrowLayout: boolean) {
    const callbacks = new Map<string, (...args: any[]) => void>();
    const attributes = new Map<string, string>();
    const link = { focus() { document.activeElement = link; } };
    const toggle = { hidden: true, focus() { document.activeElement = toggle; },
        setAttribute(name: string, value: string) { attributes.set(name, value); },
        addEventListener(name: string, callback: (...args: any[]) => void) { callbacks.set(name, callback); } };
    const sidebar = { hidden: false, contains(node: unknown) { return node === link; }, querySelector() { return link; } };
    const media = { matches: narrowLayout, addEventListener(name: string, callback: (...args: any[]) => void) { callbacks.set(name, callback); } };
    const document = { activeElement: {} as unknown,
        documentElement: { classList: { add() {} }, style: { setProperty() {} } },
        querySelector() { return toggle; }, getElementById() { return sidebar; },
        addEventListener(name: string, callback: (...args: any[]) => void) { callbacks.set(name, callback); } };
    runInNewContext(script, { document, matchMedia: () => media, ResizeObserver: class { observe() {} } });
    return { document, toggle, sidebar, link, media, attributes, callbacks };
}

describe('documentation navigation disclosure', () => {
    it('uses a native button and genuinely hidden closed content, not an offscreen checkbox', () => {
        expect(template).to.include('type="button" class="nav-toggle"');
        expect(template).to.include('aria-controls="docs-sidebar"');
        expect(template).to.include('[hidden] { display: none !important; }');
        expect(template).not.to.include('type="checkbox"');
        expect(template).not.to.include('translateX(-100%)');
        expect(template).to.include('<aside class="sidebar" id="docs-sidebar">'); // visible without JS
        expect(template).to.include('aria-current="page"');
    });
    it('starts closed on mobile; click expands; Escape closes and restores focus', () => {
        const state = setup(true);
        expect(state.toggle.hidden).to.equal(false);
        expect(state.sidebar.hidden).to.equal(true);
        expect(state.attributes.get('aria-expanded')).to.equal('false');
        state.callbacks.get('click')!();
        expect(state.sidebar.hidden).to.equal(false);
        expect(state.attributes.get('aria-expanded')).to.equal('true');
        state.document.activeElement = state.link;
        state.callbacks.get('keydown')!({ key: 'Escape' });
        expect(state.sidebar.hidden).to.equal(true);
        expect(state.document.activeElement).to.equal(state.toggle);
    });
    it('keeps desktop links visible and transfers focus before hiding the toggle', () => {
        const state = setup(true);
        state.document.activeElement = state.toggle;
        state.media.matches = false;
        state.callbacks.get('change')!();
        expect(state.sidebar.hidden).to.equal(false);
        expect(state.toggle.hidden).to.equal(true);
        expect(state.document.activeElement).to.equal(state.link);
    });
    it('closes on narrowing, returning focus from navigation to the now-visible toggle', () => {
        const state = setup(false);
        expect(state.sidebar.hidden).to.equal(false);
        state.document.activeElement = state.link;
        state.media.matches = true;
        state.callbacks.get('change')!();
        expect(state.sidebar.hidden).to.equal(true);
        expect(state.document.activeElement).to.equal(state.toggle);
    });
});
