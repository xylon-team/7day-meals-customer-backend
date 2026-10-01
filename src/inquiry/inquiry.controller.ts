import { Body, Controller, Post } from '@nestjs/common';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryService } from './inquiry.service';

@Controller('inquiries')
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  // ============= Submit a Guest Contact Inquiry =============
  @Post()
  submitInquiry(@Body() dto: CreateInquiryDto) {
    // Guests can submit inquiries without a customer account or JWT.
    return this.inquiryService.submitInquiry(dto);
  }
}
