import type { Context } from 'hono';
import { NotFoundError, ValidationError } from '../../core/errors.js';

export function errorHandler(err: Error, c: Context) {
    if (err instanceof NotFoundError) {
        return c.json({ error: err.message }, 404);
    }

    if (err instanceof ValidationError) {
        return c.json(
            { error: err.message, details: err.details },
            400,
        );
    }

    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
}
