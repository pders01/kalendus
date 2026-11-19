// Build-only static Lit CSS minification. Dynamic templates are never rewritten.
import { transform } from 'lightningcss';
import MagicString from 'magic-string';

export function staticLitCss() {
    return {
        name: 'kalendus-static-lit-css',
        enforce: 'post',
        apply: 'build',
        transform(code, id) {
            if (!/[/\\]src[/\\].*\.ts$/.test(id) || id.endsWith('.stories.ts')) return null;
            const templates = [];
            function visit(node) {
                if (!node || typeof node !== 'object') return;
                if (
                    node.type === 'TaggedTemplateExpression' &&
                    node.tag.type === 'Identifier' &&
                    node.tag.name === 'css' &&
                    node.quasi.expressions.length === 0
                )
                    templates.push(node.quasi);
                for (const value of Object.values(node)) {
                    if (Array.isArray(value)) value.forEach(visit);
                    else if (value && typeof value === 'object') visit(value);
                }
            }
            visit(this.parse(code));
            if (!templates.length) return null;
            const output = new MagicString(code);
            for (const node of templates) {
                const css = node.quasis[0].value.cooked;
                if (css === null) continue;
                const result = transform({
                    filename: `${id}.css`,
                    code: Buffer.from(css),
                    minify: true,
                });
                // Preserve the cooked CSS value when re-embedding it as a JS template.
                const escaped = result.code
                    .toString()
                    .trim()
                    .replaceAll('\\', '\\\\')
                    .replaceAll('`', '\\`')
                    .replaceAll('${', '\\${');
                output.overwrite(node.start, node.end, `\`${escaped}\``);
            }
            return {
                code: output.toString(),
                map: output.generateMap({ hires: true, source: id, includeContent: true }),
            };
        },
    };
}
