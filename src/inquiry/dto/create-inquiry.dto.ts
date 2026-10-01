import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

// ============= Guest Inquiry Input Validation =============
function trimString({ value }: TransformFnParams): unknown {
  // Preserve non-string values so validation rejects incorrect input types.
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateInquiryDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @Transform(trimString)
  @IsString()
  @IsEmail()
  @MaxLength(254)
  sender_email: string;
}
