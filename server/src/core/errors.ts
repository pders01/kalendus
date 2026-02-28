export class NotFoundError extends Error {
    constructor(resource: string, id: string) {
        super(`${resource} '${id}' not found`);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends Error {
    public readonly details: Record<string, string[]>;

    constructor(
        message: string,
        details: Record<string, string[]> = {},
    ) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
