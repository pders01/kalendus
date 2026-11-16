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
