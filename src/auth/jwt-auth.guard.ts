import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    let payload: { customer_id: number; token_version: number };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const credential = await this.prisma.customer_credential.findUnique({
      where: { customer_id: payload.customer_id },
      select: { token_version: true },
    });

    if (!credential || credential.token_version !== payload.token_version) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    request.user = {
      customer_id: payload.customer_id,
      token_version: payload.token_version,
    };
    return true;
  }
}
