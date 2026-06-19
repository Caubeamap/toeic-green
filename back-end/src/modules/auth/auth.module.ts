import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { RefreshSessionsService } from './refresh-sessions.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleTokenVerifier } from './strategies/google-token-verifier';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // @ts-expect-error: config values provide general string, but JwtModuleOptions expects StringValue
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiration'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    RefreshSessionsService,
    PasswordResetService,
    JwtStrategy,
    GoogleTokenVerifier,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
