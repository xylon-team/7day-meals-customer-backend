import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 4)
  otp: string;

  @IsString()
  @MinLength(8)
  new_password: string;
}
