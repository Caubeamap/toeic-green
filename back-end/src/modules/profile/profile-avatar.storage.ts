import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;

const AVATAR_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const AVATAR_KEY_PREFIX = 'avatars';

const AVATAR_MIME_TO_EXTENSION = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export type AvatarUploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

type R2Config = {
  accessKey?: string;
  accountId?: string;
  bucketName?: string;
  publicUrl?: string;
  secretKey?: string;
};

@Injectable()
export class ProfileAvatarStorage {
  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  async upload(userId: string, file: AvatarUploadFile) {
    const config = this.getConfig();
    const extension = getAvatarExtension(file.mimetype);
    const key = `${AVATAR_KEY_PREFIX}/${userId}/${randomUUID()}.${extension}`;

    await this.getClient(config).send(
      new PutObjectCommand({
        Body: file.buffer,
        Bucket: config.bucketName,
        CacheControl: AVATAR_CACHE_CONTROL,
        ContentLength: file.size,
        ContentType: file.mimetype,
        Key: key,
        Metadata: {
          kind: 'user-avatar',
          userId,
        },
      }),
    );

    return `${normalizePublicUrl(config.publicUrl)}/${key}`;
  }

  async deleteIfOwnedByUser(
    userId: string,
    avatarUrl: string | null | undefined,
  ) {
    const config = this.getConfig();
    const key = getOwnedAvatarKey(
      normalizePublicUrl(config.publicUrl),
      userId,
      avatarUrl,
    );

    if (!key) {
      return;
    }

    try {
      await this.getClient(config).send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[profile avatar] failed to delete old avatar:', message);
    }
  }

  private getClient(config: Required<R2Config>) {
    if (!this.client) {
      this.client = new S3Client({
        credentials: {
          accessKeyId: config.accessKey,
          secretAccessKey: config.secretKey,
        },
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        forcePathStyle: true,
        region: 'auto',
      });
    }

    return this.client;
  }

  private getConfig(): Required<R2Config> {
    const config = this.configService.get<R2Config>('storage.r2') ?? {};
    const normalizedPublicUrl = normalizePublicUrl(config.publicUrl);

    if (
      !config.accountId ||
      !config.accessKey ||
      !config.secretKey ||
      !config.bucketName ||
      !normalizedPublicUrl
    ) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình lưu trữ ảnh đại diện.',
      );
    }

    if (normalizedPublicUrl.includes('.r2.cloudflarestorage.com')) {
      throw new ServiceUnavailableException(
        'R2_PUBLIC_URL phải là origin public r2.dev hoặc custom domain, không phải S3 API endpoint.',
      );
    }

    return {
      accessKey: config.accessKey,
      accountId: config.accountId,
      bucketName: config.bucketName,
      publicUrl: normalizedPublicUrl,
      secretKey: config.secretKey,
    };
  }
}

export function isAllowedAvatarMimeType(value: string) {
  return AVATAR_MIME_TO_EXTENSION.has(value);
}

function getAvatarExtension(mimetype: string) {
  const extension = AVATAR_MIME_TO_EXTENSION.get(mimetype);

  if (!extension) {
    throw new BadRequestException('Định dạng ảnh đại diện không hợp lệ.');
  }

  return extension;
}

function normalizePublicUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

function getOwnedAvatarKey(
  publicUrl: string,
  userId: string,
  avatarUrl: string | null | undefined,
) {
  if (!avatarUrl || !avatarUrl.startsWith(`${publicUrl}/`)) {
    return null;
  }

  const key = avatarUrl.slice(publicUrl.length + 1);
  const expectedPrefix = `${AVATAR_KEY_PREFIX}/${userId}/`;

  return key.startsWith(expectedPrefix) ? key : null;
}
