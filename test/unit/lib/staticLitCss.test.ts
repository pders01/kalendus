import { expect } from 'chai';
import { parseAst } from 'rollup/parseAst';

import { staticLitCss } from '../../../scripts/static-lit-css.mjs';

async function transform(source: string, id = '/project/src/components/Example.ts') {
    return staticLitCss().transform.call({ parse: parseAst }, source, id);
}
describe('Build-only static Lit CSS minification', () => {
    it('minifies static CSS with a content-bearing source map', async () => {
        const source =
            'const styles = css`/* annotation */ .card { padding: 0px 0px; color: red; }`;';
        const result = await transform(source);
        if (!result) throw new Error('Static CSS must be transformed');
        expect(result.code).not.to.include('annotation');
        expect(result.code).to.include('padding:0');
        const map = JSON.parse(result.map.toString());
        expect(map.sourcesContent).to.deep.equal([source]);
        expect(map.mappings).not.to.equal('');
    });
    it('never rewrites interpolated templates or unrelated tags', async () => {
        for (const source of [
            'const styles = css`color: ${tone};`;',
            'const text = html`<p>  Content </p>`;',
        ])
            expect(await transform(source)).to.equal(null);
    });
    it('re-embeds escaped backslashes, backticks and interpolation-like content without executing it', async () => {
        const source =
            'const styles = css`.x::before { content: "\\\\41 \\` \\${notAnExpression}"; }`;';
        const result = await transform(source);
        if (!result) throw new Error('Static CSS must be transformed');
        const css = new Function('css', result.code + ';return styles;')(
            (strings: TemplateStringsArray) => strings[0],
        );
        expect(css).to.include('`');
        expect(css).to.include('${notAnExpression}');
        // CSS \\41 is the character A; minification may use the literal glyph.
        expect(css).to.include('A` ${notAnExpression}');
    });
    it('keeps container queries and logical geometry in the minified stylesheet', async () => {
        const result = await transform(
            'const styles=css`@container (min-width: 20em) { .x { inset-inline-start: 1em; min-block-size: 44px; } }`;',
        );
        if (!result) throw new Error('Static CSS must be transformed');
        expect(result.code).to.include('@container');
        expect(result.code).to.include('inset-inline-start:1em');
        expect(result.code).to.include('min-block-size:44px');
    });
    it('does not process dependencies or story source', async () => {
        for (const id of ['/project/node_modules/example.ts', '/project/src/example.stories.ts'])
            expect(await transform('const styles=css`.x { color: red }`', id)).to.equal(null);
    });
});
