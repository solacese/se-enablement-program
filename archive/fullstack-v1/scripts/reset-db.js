// Deletes the local SQLite database and uploads. Demo data is re-seeded on next start.
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const db = resolve(process.env.DATABASE_PATH ?? 'data/app.db');
for (const f of [db, `${db}-wal`, `${db}-shm`]) rmSync(f, { force: true });
rmSync(resolve(process.env.UPLOAD_DIR ?? 'data/uploads'), { recursive: true, force: true });
console.log('Database reset. Start the app to re-seed demo data.');
