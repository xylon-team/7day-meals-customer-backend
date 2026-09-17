import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdatePrefDeliveryDateDto {
  @IsNotEmpty()
  @IsDateString()
  delivery_preferred_date: string;
}
