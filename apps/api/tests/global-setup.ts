import { seedDatabase } from '../prisma/seed.js';

export async function setup() {
  await seedDatabase();
}
