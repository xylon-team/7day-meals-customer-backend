import { Injectable } from '@nestjs/common';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const customer = await this.prisma.$transaction(async (tx) => {
        const created = await tx.customer.create({
          data: {
            fname: dto.fname,
            lname: dto.lname,
            phone_number: dto.phone_number,
            latitude: dto.latitude ? new Prisma.Decimal(dto.latitude) : undefined,
            longitude: dto.longitude ? new Prisma.Decimal(dto.longitude) : undefined,
            address_line_1: dto.address_line_1,
            address_line_2: dto.address_line_2,
          },
        });

        await tx.customer_credential.create({
          data: {
            customer_id: created.customer_id,
            email: dto.email,
            customer_password: hashedPassword,
            token_version: 0,
          },
        });

        return created;
      });

      return { customer_id: customer.customer_id, email: dto.email };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already registered');
        }
        throw new BadRequestException(`Invalid registration data: ${error.message}`);
      }
      throw new InternalServerErrorException(
        'Failed to register: An unexpected error occurred',
      );
    }
  }

  async login(dto: LoginDto) {
    const credential = await this.prisma.customer_credential.findFirst({
      where: { email: dto.email },
      include: { customer: true },
    });

    if (!credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      credential.customer_password,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!credential.customer.is_active || credential.customer.is_deleted) {
      throw new ForbiddenException('Account inactive');
    }

    const payload = {
      customer_id: credential.customer_id,
      token_version: credential.token_version,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      customer: {
        customer_id: credential.customer_id,
        fname: credential.customer.fname,
        lname: credential.customer.lname,
        email: credential.email,
      },
    };
  }

  async logout(customerId: number) {
    try {
      await this.prisma.customer_credential.update({
        where: { customer_id: customerId },
        data: { token_version: { increment: 1 } },
      });
      return { message: 'Logged out' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Customer not found');
        }
        throw new BadRequestException(`Failed to logout: ${error.message}`);
      }
      throw new InternalServerErrorException(
        'Failed to logout: An unexpected error occurred',
      );
    }
  }
}
