import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { PasswordResetService } from './password-reset.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
    private configService: ConfigService,
  ) {}

  /** Thuộc tính cookie refresh_token dùng chung cho cả set và clear (phải khớp
   *  nhau, nếu không trình duyệt sẽ không xoá đúng cookie). `secure` lấy từ config
   *  tường minh thay vì so sánh chuỗi NODE_ENV. */
  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<boolean>('app.cookieSecure') ?? false,
      sameSite: 'strict',
      path: '/',
    };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendDto.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.passwordResetService.issue(forgotDto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  async verifyResetOtp(@Body() verifyOtpDto: VerifyResetOtpDto) {
    return this.passwordResetService.verifyOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.passwordResetService.reset(resetDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('bootstrap')
  async bootstrap(@Req() request: Request) {
    const refreshToken = this.getRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token');
    }

    return this.authService.bootstrap(refreshToken);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token');
    }

    const result = await this.authService.refresh(refreshToken);
    this.setRefreshTokenCookie(response, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
      profile: result.profile,
    };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getRefreshToken(request);
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie('refresh_token', this.refreshCookieOptions());

    return { message: 'Đăng xuất thành công' };
  }

  private getRefreshToken(request: Request) {
    const requestCookies = request.cookies as
      | Record<string, string>
      | undefined;
    const requestBody = request.body as Record<string, string> | undefined;

    return requestCookies?.refresh_token || requestBody?.refreshToken;
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie('refresh_token', refreshToken, {
      ...this.refreshCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
