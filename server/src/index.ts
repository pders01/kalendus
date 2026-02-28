import { serve } from '@hono/node-server';
import { createDb } from './db/connection.js';
import { createApp } from './http/app.js';

const port = Number(process.env.PORT) || 3000;
const dbUrl = process.env.DATABASE_URL || './data/kalendus.db';

const db = createDb(dbUrl);
const { app } = createApp({ db });

serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Kalendus API server running on http://localhost:${info.port}`);
});
