import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      // Fail closed: không bao giờ dùng secret mặc định công khai để verify token.
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  private userCache = new Map<
    string,
    {
      expiresAt: number;
      value: { id: string; email: string; role: string } | null;
    }
  >();

  async validate(payload: {
    sub: string;
    email: string;
  }): Promise<{ id: string; email: string; role: string }> {
    const cacheKey = payload.sub;
    const now = Date.now();
    const cached = this.userCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      if (!cached.value) {
        throw new UnauthorizedException(
          'Người dùng không tồn tại hoặc đã bị khóa',
        );
      }
      return cached.value;
    }

    try {
      const user = await this.usersService.findAuthIdentityById(payload.sub);
      if (!user) {
        this.userCache.set(cacheKey, { expiresAt: now + 30000, value: null });
        throw new UnauthorizedException(
          'Người dùng không tồn tại hoặc đã bị khóa',
        );
      }
      if (user.status !== 'ACTIVE') {
        this.userCache.set(cacheKey, { expiresAt: now + 30000, value: null });
        throw new UnauthorizedException(
          'Tài khoản đã bị khóa hoặc ngừng hoạt động',
        );
      }
      if (!user.emailVerifiedAt) {
        this.userCache.set(cacheKey, { expiresAt: now + 30000, value: null });
        throw new UnauthorizedException('Tài khoản chưa xác minh email');
      }

      const val = { id: user.id, email: user.email, role: user.role };
      this.userCache.set(cacheKey, { expiresAt: now + 30000, value: val });
      return val;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Không thể xác thực người dùng');
    }
  }
}
