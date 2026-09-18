import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerOrderService } from './customer_order.service';

describe('CustomerOrderService status notifications', () => {
  let service: CustomerOrderService;
  const transactionOrderFindFirst = jest.fn();
  const transactionOrderUpdateMany = jest.fn();
  const transactionNotificationCreate = jest.fn();
  const prismaTransaction = jest.fn();

  beforeEach(async () => {
    transactionOrderFindFirst.mockReset();
    transactionOrderUpdateMany.mockReset();
    transactionNotificationCreate.mockReset();
    prismaTransaction.mockReset();

    const transaction = {
      customer_order: {
        findFirst: transactionOrderFindFirst,
        updateMany: transactionOrderUpdateMany,
      },
      notification: { create: transactionNotificationCreate },
    };
    prismaTransaction.mockImplementation(
      (callback: (client: typeof transaction) => unknown) =>
        Promise.resolve(callback(transaction)),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerOrderService,
        {
          provide: PrismaService,
          useValue: { $transaction: prismaTransaction },
        },
      ],
    }).compile();

    service = module.get<CustomerOrderService>(CustomerOrderService);
  });

  // ============= Order Status Change Notifications =============
  it('stores one notification containing every changed order status', async () => {
    const currentOrder = {
      order_id: 11,
      customer_id: 7,
      order_status: 'pending',
      payment_status: 'unpaid',
      delivery_status: 'not_dispatched',
    };
    const updatedOrder = {
      ...currentOrder,
      order_status: 'confirmed',
      payment_status: 'paid',
      delivery_status: 'dispatched',
    };
    transactionOrderFindFirst
      .mockResolvedValueOnce(currentOrder)
      .mockResolvedValueOnce(updatedOrder);
    transactionOrderUpdateMany.mockResolvedValue({ count: 1 });
    transactionNotificationCreate.mockResolvedValue({ notif_id: 31 });

    await expect(
      service.updateStatus('7', '11', {
        order_status: 'confirmed',
        payment_status: 'paid',
        delivery_status: 'dispatched',
      }),
    ).resolves.toEqual(updatedOrder);
    expect(transactionNotificationCreate).toHaveBeenCalledWith({
      data: {
        customer_id: 7,
        title: 'Order status updated',
        message:
          'Order #11 update: Order status changed to confirmed; Payment status changed to paid; Delivery status changed to dispatched.',
        type: 'order',
      },
    });
  });

  it('does not create a notification when no order status changes', async () => {
    const order = {
      order_id: 11,
      customer_id: 7,
      order_status: 'pending',
      payment_status: 'unpaid',
      delivery_status: 'not_dispatched',
    };
    transactionOrderFindFirst.mockResolvedValue(order);

    await expect(
      service.updateStatus('7', '11', { order_status: 'pending' }),
    ).resolves.toEqual(order);
    expect(transactionOrderUpdateMany).not.toHaveBeenCalled();
    expect(transactionNotificationCreate).not.toHaveBeenCalled();
  });
});
