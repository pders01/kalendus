import { readFileSync } from 'node:fs';

import { expect } from 'chai';
import ts from 'typescript';

const source = readFileSync(
    new URL('../../../src/lms-calendar.stories.ts', import.meta.url),
    'utf8',
);
const ast = ts.createSourceFile('stories.ts', source, ts.ScriptTarget.Latest, true);

// Exercise the actual initializer expressions without importing browser components
// or teaching Mocha to resolve Vite's ?raw imports. No duplicate scoping algorithm.
function initializer(name: string): string {
    let expression: string | undefined;
    function visit(node: ts.Node) {
        if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name)
            expression = node.initializer?.getText(ast);
        ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(expression, `${name} exists in the shipped-theme story factory`).to.be.a('string');
    return expression!;
}

const scopeClassFor = new Function('name', `return ${initializer('scopeClass')}`) as (
    name: string,
) => string;
const scopedCSSFor = new Function(
    'themeCSS',
    'scopeClass',
    `return ${initializer('scopedCSS')}`,
) as (css: string, scope: string) => string;

const themes = ['Default', 'Ink', 'Soft', 'Brutalist', 'Midnight'];

describe('Storybook shipped theme isolation (S01)', () => {
    for (const theme of themes) {
        it(`scopes the exact ${theme} stylesheet to one valid wrapper class`, () => {
            const css = readFileSync(
                new URL(`../../../src/themes/${theme.toLowerCase()}.css`, import.meta.url),
                'utf8',
            );
            const scope = scopeClassFor(`${theme} Theme`);
            expect(scope).to.equal(`theme-${theme.toLowerCase()}-theme`);
            expect(scope).to.match(/^[a-z][a-z0-9-]*$/);
            const scoped = scopedCSSFor(css, scope);
            const rules = scoped.replace(/\/\*[\s\S]*?\*\//g, '');
            const selectors = [...rules.matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());
            expect(selectors).to.deep.equal([`.${scope} lms-calendar`]);
            // Every shipped declaration (including color-scheme) stays intact.
            expect(scoped.replace(`.${scope} lms-calendar`, 'lms-calendar')).to.equal(css);
            for (const other of themes.filter((value) => value !== theme))
                expect(selectors).not.to.include(
                    `.${scopeClassFor(`${other} Theme`)} lms-calendar`,
                );
        });
    }

    it('does not rewrite selector-like text in comments', () => {
        const css = '/* lms-calendar { example } */\nlms-calendar { color: red; }';
        expect(scopedCSSFor(css, 'theme-test')).to.equal(
            '/* lms-calendar { example } */\n.theme-test lms-calendar { color: red; }',
        );
    });
});
