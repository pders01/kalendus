import { readFile } from 'node:fs/promises';

import { expect } from 'chai';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');
const retired = ['s1c109a21525649fd', 's7264933e3c515250'];

describe('Locale runtime consolidation', () => {
    it('preserves all 810 original runtime values while omitting only unused XLIFF-only actions', async () => {
        const { targetLocales } = JSON.parse(await read('lit-localize.json'));
        let retained = 0;
        for (const locale of targetLocales as string[]) {
            const original = await read(
                `src/locales/preserved/src/generated/locales/${locale}.ts.txt`,
            );
            const expected = new Map(
                [...original.matchAll(/(\w+): `([^`]*)`/g)].map(([, id, value]) => [id, value]),
            );
            const generated = await read(`src/generated/locales/${locale}.ts`);
            // Evaluate only our generated string-literal object, not external input.
            const runtime = new Function(
                generated.replace('export const templates =', 'return'),
            )() as Record<string, string>;
            const catalog = JSON.parse(await read(`src/locales/catalogs/${locale}.json`));
            const xliff = await read(`xliff/${locale}.xlf`);
            for (const [id, value] of expected) {
                expect(runtime[id], `${locale}/${id}`).to.equal(value);
                retained++;
            }
            for (const id of retired) {
                expect(catalog[id]).to.be.a('string').and.not.equal('');
                expect(xliff).to.include(`id="${id}"`);
                if (!expected.has(id)) expect(runtime).not.to.have.property(id);
            }
            for (const id of ['A', 'F', 'S', 'H']) expect(runtime[id]).to.equal(catalog[id]);
        }
        expect(retained).to.equal(810);
    });
});
