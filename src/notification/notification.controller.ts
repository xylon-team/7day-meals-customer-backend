import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UpdateNotificationReadStatusDto } from './dto/update-notification-read-status.dto';
import { NotificationService } from './notification.service';

@Controller('users/:userId/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ============= Customer Notification Retrieval =============
  @Get()
  findAll(@Param('userId') userId: string) {
    return this.notificationService.findAllByCustomer(userId);
  }

  // ============= Customer Notification Read Status Update =============
  @Patch(':notificationId')
  updateReadStatus(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
    @Body() updateNotificationReadStatusDto: UpdateNotificationReadStatusDto,
  ) {
    return this.notificationService.updateReadStatus(
      userId,
      notificationId,
      updateNotificationReadStatusDto,
    );
  }
}
