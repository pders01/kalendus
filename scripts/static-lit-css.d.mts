import type { SourceMap } from 'magic-string';

export function staticLitCss(): {
    name: string;
    enforce: 'post';
    apply: 'build';
    transform(
        this: { parse(code: string): unknown },
        code: string,
        id: string,
    ): Promise<{
        code: string;
        map: SourceMap;
    } | null>;
};
