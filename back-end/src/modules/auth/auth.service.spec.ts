import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthService } from './auth.service';

/**
 * Unit test cho luồng đăng nhập Google: kiểm tra chính sách "1 email = 1 phương
 * thức" và xử lý đua P2002 (deterministic, không cần DB). E2E thật ở
 * auth-google.e2e-spec.ts kiểm tra qua HTTP + constraint DB.
 */
describe('AuthService.loginWithGoogle', () => {
  let service: AuthService;
  let usersService: {
    findByOAuthAccount: jest.Mock;
    findOneByEmail: jest.Mock;
    createWithOAuth: jest.Mock;
  };
  let googleTokenVerifier: { verify: jest.Mock };
  let refreshSessionsService: { create: jest.Mock };
  let jwtService: { signAsync: jest.Mock; decode: jest.Mock };
  let configService: { get: jest.Mock };

  const identity = {
    sub: 'google-sub-1',
    email: 'New.User@Example.com',
    emailVerified: true,
    name: 'New User',
    picture: 'https://lh3.googleusercontent.com/pic',
  };
  const activeUser = {
    id: 'u1',
    email: 'new.user@example.com',
    displayName: 'New User',
    avatarUrl: 'https://lh3.googleusercontent.com/pic',
    role: 'USER',
    status: 'ACTIVE',
    emailVerifiedAt: new Date(),
  };

  function makeP2002() {
    return new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: 'test',
    });
  }

  beforeEach(() => {
    usersService = {
      findByOAuthAccount: jest.fn(),
      findOneByEmail: jest.fn(),
      createWithOAuth: jest.fn(),
    };
    googleTokenVerifier = { verify: jest.fn().mockResolvedValue(identity) };
    refreshSessionsService = { create: jest.fn().mockResolvedValue(undefined) };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
      decode: jest
        .fn()
        .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    };
    configService = { get: jest.fn().mockReturnValue('15m') };

    service = new AuthService(
      usersService as never,
      jwtService as never,
      configService as never,
      refreshSessionsService as never,
      {} as never,
      googleTokenVerifier as never,
    );
  });

  it('đăng nhập lại tài khoản Google đã liên kết (không tạo trùng)', async () => {
    usersService.findByOAuthAccount.mockResolvedValue(activeUser);

    const result = await service.loginWithGoogle('cred');

    expect(result.user.id).toBe('u1');
    expect(result.accessToken).toBeDefined();
    expect(usersService.createWithOAuth).not.toHaveBeenCalled();
    expect(refreshSessionsService.create).toHaveBeenCalledTimes(1);
  });

  it('từ chối tài khoản Google đã liên kết nhưng bị khóa', async () => {
    usersService.findByOAuthAccount.mockResolvedValue({
      ...activeUser,
      status: 'BANNED',
    });

    await expect(service.loginWithGoogle('cred')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('CHẶN khi email đã là tài khoản mật khẩu (không liên kết)', async () => {
    usersService.findByOAuthAccount.mockResolvedValue(null);
    usersService.findOneByEmail.mockResolvedValue({
      id: 'pw1',
      passwordHash: 'hash',
    });

    await expect(service.loginWithGoogle('cred')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usersService.createWithOAuth).not.toHaveBeenCalled();
  });

  it('tạo tài khoản Google mới với email chuẩn hoá + sub + avatar', async () => {
    usersService.findByOAuthAccount.mockResolvedValue(null);
    usersService.findOneByEmail.mockResolvedValue(null);
    usersService.createWithOAuth.mockResolvedValue(activeUser);

    const result = await service.loginWithGoogle('cred');

    expect(result.user.id).toBe('u1');
    expect(usersService.createWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new.user@example.com',
        provider: 'google',
        providerUserId: 'google-sub-1',
        avatarUrl: 'https://lh3.googleusercontent.com/pic',
        displayName: 'New User',
      }),
    );
  });

  it('đua P2002: dùng lại tài khoản Google do request khác vừa tạo', async () => {
    usersService.findByOAuthAccount
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activeUser);
    usersService.findOneByEmail.mockResolvedValue(null);
    usersService.createWithOAuth.mockRejectedValue(makeP2002());

    const result = await service.loginWithGoogle('cred');

    expect(result.user.id).toBe('u1');
    expect(refreshSessionsService.create).toHaveBeenCalledTimes(1);
  });

  it('đua P2002: email vừa bị tài khoản mật khẩu chiếm → CHẶN', async () => {
    usersService.findByOAuthAccount.mockResolvedValue(null);
    usersService.findOneByEmail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'pw2', passwordHash: 'hash' });
    usersService.createWithOAuth.mockRejectedValue(makeP2002());

    await expect(service.loginWithGoogle('cred')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
