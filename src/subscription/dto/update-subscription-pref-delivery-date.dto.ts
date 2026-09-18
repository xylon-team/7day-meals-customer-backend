import { IsDateString } from 'class-validator';

export class UpdateSubscriptionPrefDeliveryDateDto {
  @IsDateString()
  delivery_preferred_date: string;
}
