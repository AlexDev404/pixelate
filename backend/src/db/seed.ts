import { db } from './index.js';
import { projectAccessLevels } from './schema.js';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('Seeding access levels...');

  const levels = [
    { access_level: 30, name: 'owner' },
    { access_level: 25, name: 'editor' },
    { access_level: 20, name: 'member' },
    { access_level: 10, name: 'viewer' },
  ];

  for (const level of levels) {
    await db
      .insert(projectAccessLevels)
      .values(level)
      .onConflictDoNothing({ target: projectAccessLevels.access_level });
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
