import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

/** Bound bytes before JSON parsing, including chunked bodies and misleading Content-Length. */
export function boundedBody(maxBytes = 32_768): MiddlewareHandler {
    if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 16_777_216)
        throw new Error('Invalid body limit');
    return async (c, next) => {
        const request = c.req.raw;
        if (!request.body) return next();
        const reader = request.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                size += value.byteLength;
                if (size > maxBytes) throw new HTTPException(413, { message: 'Payload Too Large' });
                if (value.byteLength) chunks.push(value);
            }
        } finally {
            // Cancellation must not hold the response hostage to a hostile underlying source.
            void reader.cancel().catch(() => {});
            reader.releaseLock();
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
        }
        c.req.raw = new Request(request, { body: bytes });
        await next();
    };
}
