import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  const notificationFindMany = jest.fn();
  const notificationUpdateMany = jest.fn();
  const notificationFindFirst = jest.fn();

  beforeEach(async () => {
    notificationFindMany.mockReset();
    notificationUpdateMany.mockReset();
    notificationFindFirst.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findMany: notificationFindMany,
              updateMany: notificationUpdateMany,
              findFirst: notificationFindFirst,
            },
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  // ============= Customer Notification Retrieval =============
  it('returns the customer notifications from newest to oldest', async () => {
    const notifications = [{ notif_id: 2 }, { notif_id: 1 }];
    notificationFindMany.mockResolvedValue(notifications);

    await expect(service.findAllByCustomer('7')).resolves.toEqual(
      notifications,
    );
    expect(notificationFindMany).toHaveBeenCalledWith({
      where: { customer_id: 7 },
      orderBy: { created_at: 'desc' },
    });
  });

  it('rejects an invalid customer ID before querying notifications', async () => {
    await expect(service.findAllByCustomer('invalid')).rejects.toThrow(
      new NotFoundException('Invalid customer ID'),
    );
    expect(notificationFindMany).not.toHaveBeenCalled();
  });

  // ============= Customer Notification Read Status Update =============
  it('marks a customer notification as read and returns the updated record', async () => {
    const notification = { notif_id: 9, customer_id: 7, read_at: new Date() };
    notificationUpdateMany.mockResolvedValue({ count: 1 });
    notificationFindFirst.mockResolvedValue(notification);

    await expect(
      service.updateReadStatus('7', '9', { is_read: true }),
    ).resolves.toEqual(notification);
    expect(notificationUpdateMany).toHaveBeenCalledTimes(1);
    expect(notificationFindFirst).toHaveBeenCalledWith({
      where: { notif_id: 9, customer_id: 7 },
    });
  });

  it('clears the read timestamp when a notification is marked unread', async () => {
    notificationUpdateMany.mockResolvedValue({ count: 1 });
    notificationFindFirst.mockResolvedValue({
      notif_id: 9,
      customer_id: 7,
      read_at: null,
    });

    await service.updateReadStatus('7', '9', { is_read: false });

    expect(notificationUpdateMany).toHaveBeenCalledWith({
      where: { notif_id: 9, customer_id: 7 },
      data: { read_at: null },
    });
  });

  it('does not update a notification outside the specified customer scope', async () => {
    notificationUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateReadStatus('7', '9', { is_read: true }),
    ).rejects.toThrow(new NotFoundException('Notification not found'));
    expect(notificationFindFirst).not.toHaveBeenCalled();
  });
});
