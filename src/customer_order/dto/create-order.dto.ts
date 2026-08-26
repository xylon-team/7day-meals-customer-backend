import { IsInt, IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  customer_id: number;

  @IsInt()
  meal_id: number;

  @IsString()
  order_status: string;

  @IsString()
  payment_status: string;

  @IsString()
  delivery_status: string;

  @IsDateString()
  delivery_preferred_date: string;

  @IsOptional()
  @IsBoolean()
  is_a_subscribed_meal?: boolean;

  @IsOptional()
  @IsInt()
  delivery_person_id?: number;

  @IsOptional()
  @IsInt()
  offer_id?: number;
}
