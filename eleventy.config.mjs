import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import GithubSlugger from 'github-slugger';

export const pathPrefix = '/kalendus/';

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

export default function (eleventyConfig) {
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.amendLibrary('md', (markdown) => markdown.use(headingIds));

    eleventyConfig.addPassthroughCopy('assets');

    eleventyConfig.addCollection('docs', (collectionApi) =>
        collectionApi
            .getFilteredByTag('docs')
            .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999)),
    );

    // Rewrite .md links to directory-style URLs so they work in the built site
    // while keeping the source markdown compatible with GitHub rendering.
    eleventyConfig.addTransform('md-links', function (content) {
        if (this.page.outputPath?.endsWith('.html')) {
            return content.replace(
                /href="(\.\/|docs\/)?([a-z][-a-z0-9]*)\.md(#[^"]*)?"/g,
                (_, prefix, slug, hash) => {
                    // All doc links resolve to /kalendus/docs/<slug>/
                    return `href="${pathPrefix}docs/${slug}/${hash || ''}"`;
                },
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
