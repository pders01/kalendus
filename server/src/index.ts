import { serve } from '@hono/node-server';

import { createDb } from './db/connection.js';
import { createApp } from './http/app.js';

const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
const hostname = process.env.HOST || '127.0.0.1';
const db = createDb();
// Standalone startup is deliberately closed unless demo mode is explicitly selected.
// Private hosts embed createApp({ db, authorize }) after authenticating requests.
const { app } = createApp({
    db,
    mode: process.env.KALENDUS_PUBLIC_DEMO === 'true' ? 'public' : 'private',
    allowedOrigins: process.env.KALENDUS_ALLOWED_ORIGINS?.split(',').filter(Boolean),
});

serve({ fetch: app.fetch, port, hostname }, (info) => {
    console.log(`Kalendus API server running on http://localhost:${info.port}`);
});
