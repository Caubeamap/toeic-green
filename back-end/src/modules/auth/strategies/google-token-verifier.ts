import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleIdentity {
  /** Google account stable id (`sub`) — dùng làm providerUserId, không dùng email. */
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

/**
 * Xác minh Google ID token (credential từ Google Identity Services trên frontend).
 *
 * Tách riêng khỏi AuthService để (1) giữ một `OAuth2Client` singleton — thư viện
 * cache public cert của Google in-memory nên sau lần đầu KHÔNG round-trip mạng mỗi
 * request (quan trọng khi nhiều người dùng đăng nhập đồng thời); (2) dễ MOCK trong
 * unit/e2e test mà không gọi Google thật.
 */
@Injectable()
export class GoogleTokenVerifier {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('app.googleClientId') || '';
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<GoogleIdentity> {
    if (!this.clientId) {
      throw new UnauthorizedException(
        'Đăng nhập bằng Google chưa được cấu hình',
      );
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token Google không hợp lệ');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Token Google không hợp lệ');
    }
    if (payload.email_verified !== true) {
      throw new UnauthorizedException('Email Google chưa được xác minh');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: true,
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    };
  }
}
