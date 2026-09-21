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
  it('returns order items, totals, delivery details, and status information', async () => {
    const orders = [
      {
        order_id: 12,
        order_timestamp: new Date('2026-09-20T09:00:00.000Z'),
        subscription_id: null,
        is_a_subscribed_meal: false,
        order_status: 'delivered',
        payment_status: 'paid',
        delivery_status: 'delivered',
        delivery_preferred_date: new Date('2026-09-21T12:00:00.000Z'),
        meal_plan: {
          meal_id: 3,
          item_name: 'Balanced Lunch Plan',
          category: 'Lunch',
          dietary_preference: 'Vegetarian',
          price: 1200,
          image_path: '/meals/lunch.jpg',
          meal_plan_food_item: [
            {
              day: 'Monday',
              meal_type: 'Lunch',
              food_item: {
                food_item_id: 5,
                item_name: 'Vegetable Curry',
                ingredient_list: 'Vegetables, spices',
                image_path: '/foods/curry.jpg',
                price: 600,
              },
            },
          ],
        },
        offer: { offer_id: 2, coupon_number: 'SAVE100', title: 'Save 100', amount: 100 },
        delivery_person: {
          delivery_person_id: 4,
          rider_name: 'Alex Smith',
          phone_number: '0712345678',
        },
        delivery_feedback: [],
      },
    ];
    orderFindMany.mockResolvedValue(orders);

    await expect(service.findOrderHistory('7')).resolves.toEqual([
      {
        order_id: 12,
        order_date: new Date('2026-09-20T09:00:00.000Z'),
        subscription_id: null,
        is_a_subscribed_meal: false,
        ordered_items: [
          {
            food_item_id: 5,
            item_name: 'Vegetable Curry',
            ingredient_list: 'Vegetables, spices',
            image_path: '/foods/curry.jpg',
            price: 600,
            day: 'Monday',
            meal_type: 'Lunch',
          },
        ],
        meal_plan: {
          meal_id: 3,
          item_name: 'Balanced Lunch Plan',
          category: 'Lunch',
          dietary_preference: 'Vegetarian',
          image_path: '/meals/lunch.jpg',
        },
        totals: {
          subtotal: 1200,
          discount_amount: 100,
          delivery_fee: null,
          total_amount: 1100,
        },
        delivery: {
          preferred_date: new Date('2026-09-21T12:00:00.000Z'),
          status: 'delivered',
          delivery_person: {
            delivery_person_id: 4,
            rider_name: 'Alex Smith',
            phone_number: '0712345678',
          },
        },
        status: {
          order_status: 'delivered',
          payment_status: 'paid',
          delivery_status: 'delivered',
        },
        offer: {
          offer_id: 2,
          coupon_number: 'SAVE100',
          title: 'Save 100',
          amount: 100,
        },
        delivery_feedback: [],
      },
    ]);
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
            meal_plan_food_item: {
              select: {
                day: true,
                meal_type: true,
                food_item: {
                  select: {
                    food_item_id: true,
                    item_name: true,
                    ingredient_list: true,
                    image_path: true,
                    price: true,
                  },
                },
              },
            },
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
