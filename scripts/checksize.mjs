import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

import ts from 'typescript';

const argument = process.argv.indexOf('--budgets');
const budgets = JSON.parse(
    readFileSync(argument < 0 ? 'bundle-budgets.json' : process.argv[argument + 1], 'utf8'),
);
const gzipBytes = (file) => gzipSync(readFileSync(resolve('dist', file)), { level: 9 }).length;
const esmFiles = readdirSync('dist').filter(
    (file) => file.endsWith('.js') && file !== 'kalendus.iife.js',
);
// Rollup may emit a thin entry re-export. Count its entire eager relative
// import graph, but not dynamic imports or the consumer's peer dependencies.
const eagerFiles = new Set();
function visit(file) {
    if (eagerFiles.has(file)) return;
    eagerFiles.add(file);
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
    for (const node of source.statements) {
        if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node))) continue;
        const specifier = node.moduleSpecifier;
        if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith('.'))
            visit(resolve(dirname(file), specifier.text));
    }
}
visit(resolve('dist/kalendus.js'));
const measurements = {
    mainGzipBytes: [...eagerFiles].reduce((sum, file) => sum + gzipBytes(file), 0),
    esmTotalGzipBytes: esmFiles.reduce((sum, file) => sum + gzipBytes(file), 0),
    iifeGzipBytes: gzipBytes('kalendus.iife.js'),
};
let failed = false;
for (const [key, actual] of Object.entries(measurements)) {
    const budget = budgets[key];
    if (!Number.isSafeInteger(budget) || budget <= 0)
        throw new Error(`Invalid bundle budget: ${key}`);
    const ok = actual <= budget;
    console.log(
        `${ok ? 'PASS' : 'FAIL'} ${key}: ${actual.toLocaleString()} / ${budget.toLocaleString()} bytes`,
    );
    failed ||= !ok;
}
if (failed) process.exitCode = 1;
