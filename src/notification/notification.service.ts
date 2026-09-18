import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationReadStatusDto } from './dto/update-notification-read-status.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ============= Customer Notification Storage =============
  async create(userId: string, createNotificationDto: CreateNotificationDto) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');
    const customer = await this.prisma.customer.findUnique({
      where: { customer_id: customerId },
      select: { customer_id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.notification.create({
      data: {
        customer_id: customerId,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        type: createNotificationDto.type,
      },
    });
  }

  // ============= Customer Notification Retrieval =============
  async findAllByCustomer(userId: string) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');

    return this.prisma.notification.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
    });
  }

  // ============= Customer Notification Read Status Update =============
  async updateReadStatus(
    userId: string,
    notificationId: string,
    updateNotificationReadStatusDto: UpdateNotificationReadStatusDto,
  ) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');
    const parsedNotificationId = this.parsePositiveInteger(
      notificationId,
      'notification ID',
    );

    const updateResult = await this.prisma.notification.updateMany({
      where: {
        notif_id: parsedNotificationId,
        customer_id: customerId,
      },
      data: {
        read_at: updateNotificationReadStatusDto.is_read ? new Date() : null,
      },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.findFirst({
      where: {
        notif_id: parsedNotificationId,
        customer_id: customerId,
      },
    });
  }

  // --------------------- Path parameter validation ------------------
  private parsePositiveInteger(value: string, fieldName: string): number {
    const parsedValue = Number(value);

    if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
      throw new NotFoundException(`Invalid ${fieldName}`);
    }

    return parsedValue;
  }
}
