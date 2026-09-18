import { IsBoolean } from 'class-validator';

export class UpdateNotificationReadStatusDto {
  @IsBoolean()
  is_read: boolean;
}
