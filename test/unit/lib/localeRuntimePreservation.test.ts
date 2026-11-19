import { readFile } from 'node:fs/promises';

import { expect } from 'chai';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');
const retired = ['s1c109a21525649fd', 's7264933e3c515250'];

describe('Locale runtime consolidation', () => {
    it('keeps one historical XLIFF snapshot for every historical runtime snapshot', async () => {
        const paths = Object.keys(JSON.parse(await read('src/locales/preserved/sha256.json')));
        const runtime = paths.filter((path) => path.startsWith('src/generated/locales/'));
        const expectedXliff = runtime.map((path) =>
            path.replace(/^src\/generated\/locales\/(.+)\.ts$/, 'xliff/$1.xlf'),
        );
        expect(runtime).to.have.lengthOf(27);
        expect(paths.sort()).to.deep.equal([...runtime, ...expectedXliff].sort());
    });

    it('preserves all 810 original runtime values while omitting only unused XLIFF-only actions', async () => {
        const manifest = JSON.parse(await read('src/locales/preserved/sha256.json'));
        let retained = 0;
        for (const path of Object.keys(manifest)) {
            const match = /^src\/generated\/locales\/([^/]+)\.ts$/.exec(path);
            if (!match) continue;
            const [, locale] = match;
            const original = await read(`src/locales/preserved/${path}.txt`);
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
