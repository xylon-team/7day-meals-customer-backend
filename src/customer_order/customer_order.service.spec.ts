import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerOrderService } from './customer_order.service';

describe('CustomerOrderService status notifications', () => {
  let service: CustomerOrderService;
  const transactionOrderFindFirst = jest.fn();
  const transactionOrderUpdateMany = jest.fn();
  const transactionNotificationCreate = jest.fn();
  const prismaTransaction = jest.fn();
  const orderFindMany = jest.fn();

  beforeEach(async () => {
    transactionOrderFindFirst.mockReset();
    transactionOrderUpdateMany.mockReset();
    transactionNotificationCreate.mockReset();
    prismaTransaction.mockReset();
    orderFindMany.mockReset();

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
          useValue: {
            $transaction: prismaTransaction,
            customer_order: { findMany: orderFindMany },
          },
        },
      ],
    }).compile();

    service = module.get<CustomerOrderService>(CustomerOrderService);
  });

  // ============= Authenticated Customer Order History =============
  it('returns the customer order history newest first with display relations', async () => {
    const orders = [{ order_id: 12, customer_id: 7 }];
    orderFindMany.mockResolvedValue(orders);

    await expect(service.findOrderHistory('7')).resolves.toEqual(orders);
    expect(orderFindMany).toHaveBeenCalledWith({
      where: { customer_id: 7 },
      orderBy: { order_timestamp: 'desc' },
      include: {
        meal_plan: {
          select: {
            meal_id: true,
            item_name: true,
            category: true,
            dietary_preference: true,
            price: true,
            image_path: true,
          },
        },
        offer: {
          select: {
            offer_id: true,
            coupon_number: true,
            title: true,
            amount: true,
          },
        },
        delivery_person: {
          select: {
            delivery_person_id: true,
            rider_name: true,
            phone_number: true,
          },
        },
        delivery_feedback: {
          select: {
            feedback_id: true,
            rating_value: true,
            description: true,
            image_path: true,
            reply: true,
            replied_date: true,
          },
        },
      },
    });
  });

  it('rejects an invalid customer ID before querying order history', async () => {
    await expect(service.findOrderHistory('invalid')).rejects.toThrow(
      'Invalid customer ID',
    );
    expect(orderFindMany).not.toHaveBeenCalled();
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
