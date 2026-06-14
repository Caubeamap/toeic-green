import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, displayName } = registerDto;

    // 1. Kiểm tra email tồn tại
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // 2. Hash mật khẩu (salt rounds = 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo user và profile rỗng (Prisma transaction trong UsersService)
    const user = await this.usersService.create(
      email,
      passwordHash,
      displayName,
    );

    // 4. Trả về thông tin cơ bản
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Tìm user theo email
    const user = await this.usersService.findOneByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }

    // 2. Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 3. Tạo token
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      // 1. Verify refresh token
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
      }>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // 2. Tìm user
      const user = await this.usersService.findOneById(payload.sub);
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException(
          'Token không hợp lệ hoặc tài khoản đã bị khóa',
        );
      }

      // 3. Sinh token mới
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException(
        'Refresh Token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async generateTokens(userId: string, email: string, role: string) {
    const jwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      // @ts-expect-error: config values provide general string, but JwtSignOptions expects StringValue
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiration'),
      }),
      // @ts-expect-error: config values provide general string, but JwtSignOptions expects StringValue
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
