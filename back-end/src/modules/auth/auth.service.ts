import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { normalizeEmail } from '../../common/utils/normalize-email';
import { pruneExpiredEntries } from '../../common/utils/prune-expired-cache';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import {
  RefreshSessionsService,
  RefreshSessionToken,
} from './refresh-sessions.service';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';
import { GoogleTokenVerifier } from './strategies/google-token-verifier';

const GOOGLE_PROVIDER = 'google';
const SESSION_REFRESH_EXPIRES_IN = '8h';

interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  rememberMe?: boolean;
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
    private googleTokenVerifier: GoogleTokenVerifier,
  ) {}

  async register(registerDto: RegisterDto) {
    const { password, displayName } = registerDto;
    const email = normalizeEmail(registerDto.email);
    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      // Tài khoản tạo bằng Google không có mật khẩu → hướng người dùng đăng nhập
      // đúng phương thức thay vì báo chung chung (chính sách: 1 email 1 phương thức).
      throw new ConflictException(
        existingUser.passwordHash
          ? 'Email này đã được sử dụng'
          : 'Email này đã đăng ký bằng Google. Vui lòng đăng nhập bằng Google.',
      );
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

    return this.issueSession(user, loginDto.rememberMe === true);
  }

  /**
   * Đăng nhập / đăng ký bằng Google Identity Services (ID-token flow).
   *
   * Chính sách: 1 email = 1 phương thức (KHÔNG liên kết). An toàn với nhiều người
   * dùng đồng thời nhờ find-or-create dựa trên unique constraint + bắt P2002 (không
   * chỉ check-then-create vốn có TOCTOU race).
   */
  async loginWithGoogle(credential: string) {
    const identity = await this.googleTokenVerifier.verify(credential);
    const email = normalizeEmail(identity.email);

    // 1. Người dùng Google đã từng đăng nhập → có sẵn OAuthAccount khớp `sub`.
    const linked = await this.usersService.findByOAuthAccount(
      GOOGLE_PROVIDER,
      identity.sub,
    );
    if (linked) {
      if (linked.status !== 'ACTIVE') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
      }
      return this.issueSession(linked, true);
    }

    // 2. Email đã thuộc một tài khoản khác. Vì tài khoản Google đã được bắt ở
    //    bước 1, user tồn tại ở đây là tài khoản đăng ký bằng mật khẩu → CHẶN.
    const existingByEmail = await this.usersService.findOneByEmail(email);
    if (existingByEmail) {
      throw new ConflictException(
        'Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu.',
      );
    }

    // 3. Tài khoản Google mới → tạo user + profile + OAuthAccount (xoá pending
    //    chưa xác minh cùng email). Bắt P2002 để xử lý đua giữa các request.
    try {
      const created = await this.usersService.createWithOAuth({
        email,
        displayName: identity.name?.trim() || email.split('@')[0],
        avatarUrl: identity.picture,
        provider: GOOGLE_PROVIDER,
        providerUserId: identity.sub,
      });
      return this.issueSession(created, true);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Một request đồng thời đã thắng. Nếu là cùng tài khoản Google → dùng lại;
        // nếu email vừa bị một tài khoản mật khẩu chiếm → CHẶN theo chính sách.
        const raced = await this.usersService.findByOAuthAccount(
          GOOGLE_PROVIDER,
          identity.sub,
        );
        if (raced) {
          if (raced.status !== 'ACTIVE') {
            throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
          }
          return this.issueSession(raced, true);
        }

        const racedByEmail = await this.usersService.findOneByEmail(email);
        if (racedByEmail) {
          throw new ConflictException(
            'Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu.',
          );
        }
      }
      throw error;
    }
  }

  /** Cấp access/refresh token + tạo refresh session cho một user đã xác thực.
   *  Dùng chung cho đăng nhập mật khẩu và đăng nhập Google. */
  private async issueSession(user: SessionUser, rememberMe: boolean) {
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      rememberMe,
    );
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
      rememberMe,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const user = await this.usersService.findSessionById(payload.sub);

      if (!user || user.status !== 'ACTIVE' || !user.emailVerifiedAt) {
        throw new UnauthorizedException('Tài khoản không còn hoạt động');
      }

      const rememberMe = payload.rememberMe ?? true;
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.role,
        rememberMe,
      );
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
        rememberMe,
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

      // Token refresh xoay mỗi lần /auth/refresh → key tăng dần; dọn entry hết hạn
      // để map không phình vô hạn theo số lượt bootstrap (mỗi lần tải trang SSR).
      pruneExpiredEntries(this.bootstrapCache, 1000);
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

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    rememberMe: boolean,
  ) {
    const jwtPayload = { sub: userId, email, role };
    const refreshSessionId = randomUUID();
    const refreshExpiration = rememberMe
      ? this.configService.get<string>('jwt.refreshExpiration')
      : SESSION_REFRESH_EXPIRES_IN;
    const [accessToken, refreshToken] = await Promise.all([
      // @ts-expect-error: config values provide general string, but JwtSignOptions expects StringValue
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiration'),
      }),
      // @ts-expect-error: config values provide general string, but JwtSignOptions expects StringValue
      this.jwtService.signAsync(
        { ...jwtPayload, jti: refreshSessionId, rememberMe },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: refreshExpiration,
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
