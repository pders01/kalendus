import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const argument = process.argv.indexOf('--budgets');
const budgets = JSON.parse(
    readFileSync(argument < 0 ? 'bundle-budgets.json' : process.argv[argument + 1], 'utf8'),
);
const gzipBytes = (file) => gzipSync(readFileSync(resolve('dist', file)), { level: 9 }).length;
const esmFiles = readdirSync('dist').filter(
    (file) => file.endsWith('.js') && file !== 'kalendus.iife.js',
);
const measurements = {
    mainGzipBytes: gzipBytes('kalendus.js'),
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
