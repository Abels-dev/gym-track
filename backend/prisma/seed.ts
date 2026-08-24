import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

function createPrismaAdapter(databaseUrl: string) {
  const url = new URL(databaseUrl);

  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\/+/, ''),
    connectionLimit: 10,
  });
}

// Since you are using a MariaDB adapter, Prisma requires us to pass it explicitly
const adapter = createPrismaAdapter(process.env.DATABASE_URL || '');
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Reading cleaned exercises...');
  const filePath = path.join(__dirname, '../cleaned-exercises.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const exercises = JSON.parse(rawData);

  console.log(`Seeding ${exercises.length} exercises into the database...`);

  // Bulk insert, ignoring duplicates to make the seeder idempotent
  await prisma.exercise.createMany({
    data: exercises.map((ex: any) => ({
      name: ex.name,
      category: ex.category,
      primaryMuscle: ex.primaryMuscle,
      secondaryMuscles: ex.secondaryMuscles,
      equipment: ex.equipment,
      instructions: ex.instructions,
      videoUrl: ex.videoUrl,
      imageUrl: ex.imageUrl,
    })),
    skipDuplicates: true,
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
