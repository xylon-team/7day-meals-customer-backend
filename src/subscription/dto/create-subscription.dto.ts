import { IsDateString, IsInt } from 'class-validator';

export class CreateSubscriptionDto {
  @IsInt()
  meal_id: number;

  @IsDateString()
  delivery_preferred_date: string;
}
