import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { normalizeEmail } from '../../common/utils/normalize-email';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import {
  RefreshSessionsService,
  RefreshSessionToken,
} from './refresh-sessions.service';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';

interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  exp: number;
}

type SessionBootstrapResult = {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
  profile: Record<string, unknown> | null;
};

@Injectable()
export class AuthService {
  private bootstrapCache = new Map<
    string,
    { expiresAt: number; value: SessionBootstrapResult }
  >();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshSessionsService: RefreshSessionsService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { password, displayName } = registerDto;
    const email = normalizeEmail(registerDto.email);
    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }
    if (await this.emailVerificationService.hasPending(email)) {
      throw new ConflictException(
        'Email này đang chờ xác minh. Vui lòng kiểm tra hộp thư hoặc gửi lại email xác minh.',
      );
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    await this.emailVerificationService.issuePendingRegistration(
      email,
      passwordHash,
      displayName,
    );

    return {
      email,
      displayName,
      verificationRequired: true,
    };
  }

  async login(loginDto: LoginDto) {
    const { password } = loginDto;
    const email = normalizeEmail(loginDto.email);
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Bạn cần xác minh email trước khi đăng nhập',
      );
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.refreshSessionsService.create(user.id, tokens.refreshSession);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const user = await this.usersService.findSessionById(payload.sub);

      if (!user || user.status !== 'ACTIVE' || !user.emailVerifiedAt) {
        throw new UnauthorizedException('Tài khoản không còn hoạt động');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.refreshSessionsService.rotate(
        user.id,
        payload.jti,
        refreshToken,
        tokens.refreshSession,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
        profile: user.profile
          ? {
              ...user.profile,
              user: {
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                role: user.role,
              },
            }
          : null,
      };
    } catch {
      throw new UnauthorizedException(
        'Refresh Token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async bootstrap(refreshToken: string): Promise<SessionBootstrapResult> {
    const cacheKey = this.hashToken(refreshToken);
    const cached = this.bootstrapCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const isSessionValid = await this.refreshSessionsService.isValid(
        payload.sub,
        payload.jti,
        refreshToken,
      );
      if (!isSessionValid) {
        throw new UnauthorizedException('Refresh session is no longer valid');
      }

      const user = await this.usersService.findSessionById(payload.sub);
      if (!user || user.status !== 'ACTIVE' || !user.emailVerifiedAt) {
        throw new UnauthorizedException('Tài khoản không còn hoạt động');
      }

      const result = {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
        profile: user.profile
          ? {
              ...user.profile,
              user: {
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                role: user.role,
              },
            }
          : null,
      };

      this.bootstrapCache.set(cacheKey, {
        expiresAt: Date.now() + 15_000,
        value: result,
      });

      return result;
    } catch {
      throw new UnauthorizedException(
        'Refresh Token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async logout(refreshToken: string) {
    try {
      this.bootstrapCache.delete(this.hashToken(refreshToken));
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.refreshSessionsService.revoke(
        payload.sub,
        payload.jti,
        refreshToken,
      );
    } catch {
      // Logout remains idempotent when the cookie is invalid or expired.
    }
  }

  async verifyEmail(token: string) {
    return this.emailVerificationService.verify(token);
  }

  async resendVerification(email: string) {
    return this.emailVerificationService.resend(email);
  }

  private async verifyRefreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      refreshToken,
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      },
    );

    if (!payload.jti) {
      throw new UnauthorizedException('Refresh token has no session');
    }

    return payload;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const jwtPayload = { sub: userId, email, role };
    const refreshSessionId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      // @ts-expect-error: config values provide general string, but JwtSignOptions expects StringValue
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiration'),
      }),
      // @ts-expect-error: config values provide general string, but JwtSignOptions expects StringValue
      this.jwtService.signAsync(
        { ...jwtPayload, jti: refreshSessionId },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
        },
      ),
    ]);
    const refreshPayload =
      this.jwtService.decode<RefreshTokenPayload>(refreshToken);

    return {
      accessToken,
      refreshToken,
      refreshSession: {
        id: refreshSessionId,
        token: refreshToken,
        expiresAt: new Date(refreshPayload.exp * 1000),
      } satisfies RefreshSessionToken,
    };
  }
}
