import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPassthroughCopy("assets");

  eleventyConfig.addCollection("docs", (collectionApi) =>
    collectionApi
      .getFilteredByTag("docs")
      .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999)),
  );

  // Rewrite .md links to directory-style URLs so they work in the built site
  // while keeping the source markdown compatible with GitHub rendering.
  eleventyConfig.addTransform("md-links", function (content) {
    if (this.page.outputPath?.endsWith(".html")) {
      return content.replace(
        /href="(\.\/|docs\/)?([a-z][-a-z0-9]*)\.md(#[^"]*)?"/g,
        (_, prefix, slug, hash) => {
          // All doc links resolve to /kalendus/docs/<slug>/
          return `href="/kalendus/docs/${slug}/${hash || ""}"`;
        },
      );
    }
    return content;
  });

  return {
    dir: {
      input: ".",
      includes: "docs/_includes",
      output: "_site",
    },
    pathPrefix: "/kalendus/",
    markdownTemplateEngine: false,
  };
}
