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
import { MailService } from './mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const OTP_EXPIRY_MINUTES = 5;
const GENERIC_FORGOT_RESPONSE = {
  message: 'If the email is registered, an OTP has been sent.',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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
            latitude: dto.latitude
              ? new Prisma.Decimal(dto.latitude)
              : undefined,
            longitude: dto.longitude
              ? new Prisma.Decimal(dto.longitude)
              : undefined,
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
        throw new BadRequestException(
          `Invalid registration data: ${error.message}`,
        );
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const credential = await this.prisma.customer_credential.findUnique({
      where: { email: dto.email },
    });

    if (!credential) {
      // Do not leak whether the account exists.
      return GENERIC_FORGOT_RESPONSE;
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    try {
      await this.prisma.$transaction([
        this.prisma.password_reset_otp.deleteMany({
          where: { email: dto.email },
        }),
        this.prisma.password_reset_otp.create({
          data: { email: dto.email, otp: hashedOtp, expiresAt },
        }),
      ]);

      await this.mailService.sendOtpEmail(dto.email, otp);
    } catch {
      throw new InternalServerErrorException(
        'Failed to send reset email: An unexpected error occurred',
      );
    }

    return GENERIC_FORGOT_RESPONSE;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const latestOtp = await this.prisma.password_reset_otp.findFirst({
      where: { email: dto.email },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (latestOtp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    const otpMatches = await bcrypt.compare(dto.otp, latestOtp.otp);
    if (!otpMatches) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(dto.new_password, 10);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.customer_credential.update({
          where: { email: dto.email },
          data: {
            customer_password: hashedPassword,
            token_version: { increment: 1 },
          },
        });
        await tx.password_reset_otp.delete({
          where: { id: latestOtp.id },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Customer not found');
        }
        throw new BadRequestException(
          `Failed to reset password: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to reset password: An unexpected error occurred',
      );
    }

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(customerId: number, dto: ChangePasswordDto) {
    const credential = await this.prisma.customer_credential.findUnique({
      where: { customer_id: customerId },
    });

    if (!credential) {
      throw new NotFoundException('Customer not found');
    }

    const currentValid = await bcrypt.compare(
      dto.current_password,
      credential.customer_password,
    );
    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.new_password, 10);

    try {
      const updated = await this.prisma.customer_credential.update({
        where: { customer_id: customerId },
        data: {
          customer_password: hashedPassword,
          token_version: { increment: 1 },
        },
        select: { token_version: true },
      });

      const access_token = await this.jwtService.signAsync({
        customer_id: customerId,
        token_version: updated.token_version,
      });

      return {
        access_token,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Customer not found');
        }
        throw new BadRequestException(
          `Failed to change password: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to change password: An unexpected error occurred',
      );
    }
  }
}
