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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') ||
        'default_jwt_access_secret_2026',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.findAuthIdentityById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        'Người dùng không tồn tại hoặc đã bị khóa',
      );
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Tài khoản đã bị khóa hoặc ngừng hoạt động',
      );
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Tài khoản chưa xác minh email');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
