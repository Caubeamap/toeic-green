import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface RefreshSessionToken {
  id: string;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshSessionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, session: RefreshSessionToken) {
    await this.prisma.refreshSession.create({
      data: {
        id: session.id,
        userId,
        tokenHash: this.hashToken(session.token),
        expiresAt: session.expiresAt,
      },
    });
  }

  async rotate(
    userId: string,
    currentSessionId: string,
    currentToken: string,
    nextSession: RefreshSessionToken,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshSession.updateMany({
        where: {
          id: currentSessionId,
          userId,
          tokenHash: this.hashToken(currentToken),
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh session is no longer valid');
      }

      await tx.refreshSession.create({
        data: {
          id: nextSession.id,
          userId,
          tokenHash: this.hashToken(nextSession.token),
          expiresAt: nextSession.expiresAt,
        },
      });
    });
  }

  async revoke(userId: string, sessionId: string, token: string) {
    await this.prisma.refreshSession.updateMany({
      where: {
        id: sessionId,
        userId,
        tokenHash: this.hashToken(token),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async isValid(userId: string, sessionId: string, token: string) {
    const session = await this.prisma.refreshSession.findFirst({
      where: {
        id: sessionId,
        userId,
        tokenHash: this.hashToken(token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    return Boolean(session);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
