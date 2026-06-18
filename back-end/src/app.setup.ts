import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

export function configureApp(app: NestExpressApplication) {
  // Sau CDN/reverse-proxy phải tin đúng số hop để lấy client IP thật từ
  // X-Forwarded-For; nếu không rate-limiter (key theo IP) gom mọi user vào IP của
  // proxy và chặn nhầm hàng loạt khi có nhiều người dùng. Cấu hình qua TRUST_PROXY.
  const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);
  if (trustProxy !== null) {
    app.set('trust proxy', trustProxy);
  }

  app.use(helmet());
  app.use(
    compression({
      threshold: 1024, // Chỉ nén các response có kích thước > 1KB
    }),
  );
  app.useBodyParser('json', { limit: '100kb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '100kb' });
  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      if (isPayloadTooLargeError(error)) {
        response.status(413).json({
          statusCode: 413,
          message: 'Dữ liệu gửi lên vượt quá giới hạn cho phép.',
          error: 'Payload Too Large',
        });
        return;
      }

      next(error);
    },
  );
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          statusCode: 400,
          message: 'Dữ liệu gửi lên không hợp lệ.',
          error: 'Bad Request',
          validationErrors: flattenValidationErrors(errors),
        }),
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: false,
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:6868';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  return { frontendUrl };
}

function parseTrustProxy(value: string | undefined): number | boolean | null {
  if (value === undefined || value === '') {
    return null;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  const hops = Number.parseInt(value, 10);
  return Number.isNaN(hops) ? null : hops;
}

interface ValidationIssue {
  field: string;
  messages: string[];
}

function isPayloadTooLargeError(error: unknown): error is { type: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  );
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationIssue[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const messages = Object.values(error.constraints ?? {});

    return [
      ...(messages.length > 0 ? [{ field, messages }] : []),
      ...flattenValidationErrors(error.children ?? [], field),
    ];
  });
}
