import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService notification events', () => {
  let service: SubscriptionService;
  const transactionCustomerFindUnique = jest.fn();
  const transactionMealFindFirst = jest.fn();
  const transactionSubscriptionCreate = jest.fn();
  const transactionSubscriptionUpdateMany = jest.fn();
  const transactionNotificationCreate = jest.fn();
  const subscriptionFindFirst = jest.fn();
  const prismaTransaction = jest.fn();

  beforeEach(async () => {
    transactionCustomerFindUnique.mockReset();
    transactionMealFindFirst.mockReset();
    transactionSubscriptionCreate.mockReset();
    transactionSubscriptionUpdateMany.mockReset();
    transactionNotificationCreate.mockReset();
    subscriptionFindFirst.mockReset();
    prismaTransaction.mockReset();

    const transaction = {
      customer: { findUnique: transactionCustomerFindUnique },
      meal_plan: { findFirst: transactionMealFindFirst },
      subscription: {
        create: transactionSubscriptionCreate,
        updateMany: transactionSubscriptionUpdateMany,
      },
      notification: { create: transactionNotificationCreate },
    };
    prismaTransaction.mockImplementation(
      (callback: (client: typeof transaction) => unknown) =>
        Promise.resolve(callback(transaction)),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: prismaTransaction,
            subscription: { findFirst: subscriptionFindFirst },
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  // ============= Subscription Lifecycle Notifications =============
  it('stores an unread notification when a subscription is created', async () => {
    const deliveryDate = '2026-10-01T10:00:00.000Z';
    const subscription = { subscription_id: 3, customer_id: 7 };
    transactionCustomerFindUnique.mockResolvedValue({ customer_id: 7 });
    transactionMealFindFirst.mockResolvedValue({ meal_id: 4 });
    transactionSubscriptionCreate.mockResolvedValue(subscription);

    await expect(
      service.create('7', {
        meal_id: 4,
        delivery_preferred_date: deliveryDate,
      }),
    ).resolves.toEqual(subscription);
    expect(transactionNotificationCreate).toHaveBeenCalledWith({
      data: {
        customer_id: 7,
        title: 'Subscription created',
        message: `Your meal subscription has been created. Your first delivery is scheduled for ${deliveryDate}.`,
        type: 'subscription',
      },
    });
  });

  it('stores a notification when a subscription delivery date changes', async () => {
    const deliveryDate = '2026-10-08T10:00:00.000Z';
    transactionSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
    subscriptionFindFirst.mockResolvedValue({ subscription_id: 3 });

    await service.updatePrefDeliveryDate('7', '3', {
      delivery_preferred_date: deliveryDate,
    });

    expect(transactionNotificationCreate).toHaveBeenCalledWith({
      data: {
        customer_id: 7,
        title: 'Subscription delivery updated',
        message: `Your subscription delivery date has been updated to ${deliveryDate}.`,
        type: 'subscription',
      },
    });
  });

  it('stores a notification when an active subscription is canceled', async () => {
    transactionSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
    subscriptionFindFirst.mockResolvedValue({ subscription_id: 3 });

    await service.cancel('7', '3');

    expect(transactionNotificationCreate).toHaveBeenCalledWith({
      data: {
        customer_id: 7,
        title: 'Subscription canceled',
        message: 'Your meal subscription has been canceled.',
        type: 'subscription',
      },
    });
  });
});
