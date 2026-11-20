import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { idSchema, validate } from '../core/validation.js';

export type AuthorizationAction = 'create' | 'read' | 'write' | 'delete' | 'stream' | 'telemetry';

/** Host policy must authenticate the request and authorize this resource, not just its ID. */
export interface AuthorizationRequest {
    request: Request;
    action: AuthorizationAction;
    resource: 'calendar' | 'event' | 'manifest' | 'stream' | 'telemetry';
    calendarId?: string;
    eventId?: string;
}

/** Return true to grant access. False denies; exceptions never grant access. */
export type AuthorizationPolicy = (context: AuthorizationRequest) => boolean | Promise<boolean>;

/** Grant full-calendar event details on an already authorized stream. Never use event-scoped access here. */
export type StreamDetailsPolicy = (context: {
    request: Request;
    calendarId: string;
}) => boolean | Promise<boolean>;

export type AuthorizationGuard = (
    resource: AuthorizationRequest['resource'],
    action: AuthorizationAction,
    ...params: [] | ['calendarId'] | ['calendarId', 'eventId']
) => MiddlewareHandler;

export function createAuthorizationGuard({
    mode,
    authorize,
}: {
    mode?: 'private' | 'public';
    authorize?: AuthorizationPolicy;
}): AuthorizationGuard {
    return (resource, action, ...[calendarParam, eventParam]) =>
        async (c, next) => {
            const calendarId = calendarParam
                ? validate(idSchema, c.req.param(calendarParam))
                : undefined;
            const eventId = eventParam ? validate(idSchema, c.req.param(eventParam)) : undefined;
            const granted = authorize
                ? await authorize({ request: c.req.raw, resource, action, calendarId, eventId })
                : mode === 'public';
            if (granted !== true) throw new HTTPException(403, { message: 'Access denied' });
            await next();
        };
}
