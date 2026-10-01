import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(private readonly prisma: PrismaService) {}

  // ============= Store a Validated Guest Inquiry =============
  async submitInquiry(dto: CreateInquiryDto) {
    try {
      // --------------------- Existing Table Storage ------------------
      // Only accept guest fields; the database assigns the ID and timestamp.
      return await this.prisma.inquiry.create({
        data: {
          title: dto.title,
          message: dto.message,
          sender_email: dto.sender_email,
        },
      });
    } catch {
      // Avoid exposing database details in a public endpoint response.
      throw new InternalServerErrorException('Failed to submit inquiry');
    }
  }
}
