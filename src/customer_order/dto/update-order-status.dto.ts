import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsString()
  order_status?: string;

  @IsOptional()
  @IsString()
  payment_status?: string;

  @IsOptional()
  @IsString()
  delivery_status?: string;
}
