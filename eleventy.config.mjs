import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import GithubSlugger from 'github-slugger';

export const pathPrefix = '/kalendus/';

const sectionOrder = ['Getting Started', 'Usage', 'Layout', 'Reference', 'Internals', 'Archive'];
const sectionRank = (section) => {
    const rank = sectionOrder.indexOf(section);
    return rank === -1 ? sectionOrder.length : rank;
};

function headingIds(markdown) {
    markdown.core.ruler.push('heading-ids', ({ tokens }) => {
        const slugger = new GithubSlugger();
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type !== 'heading_open' || tokens[i].attrGet('id')) continue;
            const text = tokens[i + 1].children
                ?.filter(({ type }) => type === 'text' || type === 'code_inline')
                .map(({ content }) => content)
                .join('');
            if (text) tokens[i].attrSet('id', slugger.slug(text));
        }
    });
}

function scrollableTables(markdown) {
    const rules = markdown.renderer.rules;
    rules.table_open = (tokens, index, options, _env, renderer) => {
        const heading = tokens.findLastIndex(
            (token, i) => i < index && token.type === 'heading_open',
        );
        const title = heading < 0 ? 'Table' : `Table: ${tokens[heading + 1].content}`;
        return `<div class="table-scroll" tabindex="0" role="region" aria-label="${markdown.utils.escapeHtml(title)}">${renderer.renderToken(tokens, index, options)}`;
    };
    rules.table_close = (tokens, index, options, _env, renderer) =>
        `${renderer.renderToken(tokens, index, options)}</div>\n`;
}

export default function (eleventyConfig) {
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.amendLibrary('md', (markdown) => markdown.use(headingIds).use(scrollableTables));

    eleventyConfig.addPassthroughCopy('assets');

    eleventyConfig.addCollection('docs', (collectionApi) =>
        collectionApi
            .getFilteredByTag('docs')
            .sort(
                (a, b) =>
                    sectionRank(a.data.section) - sectionRank(b.data.section) ||
                    (a.data.section ?? '').localeCompare(b.data.section ?? '') ||
                    (a.data.order ?? 999) - (b.data.order ?? 999),
            ),
    );

    // Rewrite .md links to directory-style URLs so they work in the built site
    // while keeping the source markdown compatible with GitHub rendering.
    eleventyConfig.addTransform('md-links', function (content) {
        if (this.page.outputPath?.endsWith('.html')) {
            return content
                .replace(
                    /href="(\.\/|docs\/)?([a-z][-a-z0-9]*)\.md(#[^"]*)?"/g,
                    (_, _prefix, slug, hash) => `href="${pathPrefix}docs/${slug}/${hash || ''}"`,
                )
                .replace(
                    /<pre(?=[\s>])/g,
                    '<pre tabindex="0" role="region" aria-label="Code example"',
                );
        }
        return content;
    });

    return {
        dir: {
            input: '.',
            includes: 'docs/_includes',
            output: '_site',
        },
        pathPrefix,
        markdownTemplateEngine: false,
    };
}
