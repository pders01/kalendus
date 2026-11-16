// HTTP and direct service callers share the same boundary validation.
export {
    createCalendarSchema,
    updateCalendarSchema,
    createEventSchema,
    updateEventSchema,
    dateRangeQuerySchema,
    telemetrySchema,
} from '../../core/validation.js';
