import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Connect
    await prisma.$connect();
    console.log('✓ Connected to database');

    // 2. Raw query
    const result = await prisma.$queryRaw`SELECT 1 AS one`;
    console.log('✓ Raw query works:', result);

    // 3. Query an introspected model
    const customers = await prisma.customer.findMany({ take: 1 });
    console.log(
      '✓ Model query works — customer sample count:',
      customers.length,
    );
  } catch (err) {
    console.error('✗ Database connection test failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
