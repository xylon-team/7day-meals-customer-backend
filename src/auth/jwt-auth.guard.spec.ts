import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const payload = { customer_id: 42, token_version: 3 };
  let request: { headers: { authorization: string }; user?: unknown };
  let jwtService: { verifyAsync: jest.Mock };
  let prisma: {
    customer_credential: { findUnique: jest.Mock };
  };
  let guard: JwtAuthGuard;

  const context = (): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    request = { headers: { authorization: 'Bearer valid-token' } };
    jwtService = { verifyAsync: jest.fn().mockResolvedValue(payload) };
    prisma = {
      customer_credential: {
        findUnique: jest.fn().mockResolvedValue({
          token_version: payload.token_version,
          customer: { is_active: true, is_deleted: false },
        }),
      },
    };
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      prisma as unknown as PrismaService,
    );
  });

  it('allows an active, non-deleted customer with the current token version', async () => {
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toEqual(payload);
    expect(prisma.customer_credential.findUnique).toHaveBeenCalledWith({
      where: { customer_id: payload.customer_id },
      select: {
        token_version: true,
        customer: { select: { is_active: true, is_deleted: true } },
      },
    });
  });

  it('rejects an existing token when the customer is inactive', async () => {
    prisma.customer_credential.findUnique.mockResolvedValue({
      token_version: payload.token_version,
      customer: { is_active: false, is_deleted: false },
    });

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an existing token when the customer is deleted', async () => {
    prisma.customer_credential.findUnique.mockResolvedValue({
      token_version: payload.token_version,
      customer: { is_active: true, is_deleted: true },
    });

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token with a stale token version', async () => {
    prisma.customer_credential.findUnique.mockResolvedValue({
      token_version: payload.token_version + 1,
      customer: { is_active: true, is_deleted: false },
    });

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.customer_credential.findUnique).not.toHaveBeenCalled();
  });

  it('rejects when the customer credential no longer exists', async () => {
    prisma.customer_credential.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
