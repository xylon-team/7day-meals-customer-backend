import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  fname?: string;

  @IsOptional()
  @IsString()
  lname?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  address_line_1?: string;

  @IsOptional()
  @IsString()
  address_line_2?: string;
}
