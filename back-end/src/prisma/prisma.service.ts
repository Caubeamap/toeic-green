import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
        // Remote Supabase: give bursts/cold acquires headroom instead of the
        // aggressive 2s that fails fast under load.
        connectionTimeoutMillis: 10000,
        // Keep sockets warm so the pooler is less likely to drop idle clients.
        keepAlive: true,
      });
      // A pooled idle client can emit an error (e.g. the pooler closing an idle
      // connection). Without this listener pg surfaces it as an uncaught
      // exception and crashes the process; instead, log it and let the pool drop
      // the bad client and open a fresh one on the next acquire.
      PrismaService.pool.on('error', (err: Error) => {
        console.error('[pg pool] idle client error:', err.message);
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
