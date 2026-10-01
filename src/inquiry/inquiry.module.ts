import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';

@Module({
  controllers: [InquiryController],
  providers: [InquiryService, PrismaService],
})
export class InquiryModule {}
