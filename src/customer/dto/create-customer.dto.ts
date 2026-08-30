import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  fname: string;

  @IsString()
  lname: string;

  @IsString()
  phone_number: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

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
