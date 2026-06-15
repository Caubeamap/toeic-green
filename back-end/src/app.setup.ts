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
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

export function configureApp(app: NestExpressApplication) {
  app.use(helmet());
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
