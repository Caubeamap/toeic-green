import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static pool: Pool;
  private static prismaPg: PrismaPg;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    // Instantiate pg pool if it doesn't exist (Singleton pattern)
    if (!PrismaService.pool) {
      PrismaService.pool = new Pool({
        connectionString,
        max: 20, // Configure pool connection size limit
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      PrismaService.prismaPg = new PrismaPg(PrismaService.pool);
    }

    super({
      adapter: PrismaService.prismaPg,
    });
  }

  async onModuleInit() {
    // Connections are managed by the pg Pool. The client connects on the first query.
  }

  async onModuleDestroy() {
    if (PrismaService.pool) {
      await PrismaService.pool.end();
    }
  }
}
