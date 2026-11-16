import { cpSync, rmSync } from 'node:fs';

const target = new URL('../dist/migrations/', import.meta.url);
rmSync(target, { recursive: true, force: true });
cpSync(new URL('../src/migrations/', import.meta.url), target, { recursive: true });
