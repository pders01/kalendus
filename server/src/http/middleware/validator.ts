import { validator } from 'hono/validator';
import type { ZodType } from 'zod';

import { validate } from '../../core/validation.js';

export function validateRequest<Target extends 'json' | 'query', T>(
    target: Target,
    schema: ZodType<T>,
) {
    return validator(target, (value) => validate(schema, value));
}
