import { readdirSync, readFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

import { parse } from 'parse5';

import { pathPrefix } from '../eleventy.config.mjs';

const site = process.argv[2] ?? '_site';
const origin = 'https://docs.invalid';
const files = new Set(
    readdirSync(site, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(site, join(entry.parentPath, entry.name)).split(sep).join('/')),
);
const pages = new Map();

function collect(node, page) {
    if (node.attrs) {
        const id = node.attrs.find(({ name }) => name === 'id');
        if (id) page.anchors.add(id.value);
        if (node.tagName === 'a') {
            const href = node.attrs.find(({ name }) => name === 'href');
            const named = node.attrs.find(({ name }) => name === 'name');
            if (href) page.links.add(href.value);
            if (named) page.anchors.add(named.value);
        }
    }
    node.childNodes?.forEach((child) => collect(child, page));
}

for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const page = { anchors: new Set(), links: new Set() };
    collect(parse(readFileSync(join(site, file), 'utf8')), page);
    pages.set(file, page);
}

if (!pages.has('index.html')) throw new Error(`Missing docs homepage in ${site}`);

function linkError(href, base) {
    let target, pathname, fragment;
    try {
        target = new URL(href, base);
        if (target.origin !== origin) return; // Check the built artifact without network requests.
        pathname = decodeURIComponent(target.pathname);
        fragment = decodeURIComponent(target.hash.slice(1));
    } catch {
        return 'invalid URL or percent encoding';
    }
    if (!pathname.startsWith(pathPrefix)) return 'outside the docs path prefix';
    const path = pathname.slice(pathPrefix.length);
    const file = files.has(path) ? path : posix.join(path, 'index.html');
    if (!files.has(file)) return 'missing page or file';
    if (fragment && pages.has(file) && !pages.get(file).anchors.has(fragment))
        return 'missing heading or anchor';
}

let errors = 0;
for (const [file, { links }] of pages) {
    const base = new URL(pathPrefix + file.replace(/(^|\/)index\.html$/, '$1'), origin);
    for (const href of links) {
        const problem = linkError(href, base);
        if (!problem) continue;
        console.error(`${file}: ${problem}: ${href}`);
        errors++;
    }
}
if (errors) {
    console.error(`${errors} broken internal docs link(s)`);
    process.exitCode = 1;
} else {
    console.log(`Checked internal links and anchors in ${pages.size} docs pages.`);
}
