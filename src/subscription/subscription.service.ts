import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionPrefDeliveryDateDto } from './dto/update-subscription-pref-delivery-date.dto';

const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');

    return this.prisma.subscription.findMany({
      where: { customer_id: customerId },
      orderBy: { subscribe_date: 'desc' },
      include: this.subscriptionDetailsInclude(),
    });
  }

  async findOne(userId: string, subscriptionId: string) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');
    const parsedSubscriptionId = this.parsePositiveInteger(
      subscriptionId,
      'subscription ID',
    );

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        subscription_id: parsedSubscriptionId,
        customer_id: customerId,
      },
      include: this.subscriptionDetailsInclude(),
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');

    const deliveryPreferredDate = new Date(
      createSubscriptionDto.delivery_preferred_date,
    );
    const nextDeliveryDate = new Date(
      deliveryPreferredDate.getTime() + SEVEN_DAYS_IN_MILLISECONDS,
    );

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const customer = await transaction.customer.findUnique({
          where: { customer_id: customerId },
          select: { customer_id: true },
        });

        if (!customer) {
          throw new NotFoundException('Customer not found');
        }

        const meal = await transaction.meal_plan.findFirst({
          where: {
            meal_id: createSubscriptionDto.meal_id,
            is_available: true,
          },
          select: { meal_id: true },
        });

        if (!meal) {
          throw new NotFoundException('Available meal plan not found');
        }

        return transaction.subscription.create({
          data: {
            customer_id: customerId,
            meal_id: meal.meal_id,
            delivery_preferred_date: deliveryPreferredDate,
            next_delivery_date: nextDeliveryDate,
            customer_order: {
              create: {
                customer_id: customerId,
                meal_id: meal.meal_id,
                order_status: 'pending',
                payment_status: 'unpaid',
                delivery_status: 'not_dispatched',
                delivery_preferred_date: deliveryPreferredDate,
                is_a_subscribed_meal: true,
              },
            },
          },
          include: {
            meal_plan: true,
            customer_order: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Subscription conflicts with existing data',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid customer or meal plan reference',
          );
        }
        throw new BadRequestException(
          `Failed to create subscription: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to create subscription: An unexpected error occurred',
      );
    }
  }

  async updatePrefDeliveryDate(
    userId: string,
    subscriptionId: string,
    updateSubscriptionPrefDeliveryDateDto: UpdateSubscriptionPrefDeliveryDateDto,
  ) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');
    const parsedSubscriptionId = this.parsePositiveInteger(
      subscriptionId,
      'subscription ID',
    );
    const deliveryPreferredDate = new Date(
      updateSubscriptionPrefDeliveryDateDto.delivery_preferred_date,
    );
    const nextDeliveryDate = new Date(
      deliveryPreferredDate.getTime() + SEVEN_DAYS_IN_MILLISECONDS,
    );

    const result = await this.prisma.subscription.updateMany({
      where: {
        subscription_id: parsedSubscriptionId,
        customer_id: customerId,
        canceled_date: null,
      },
      data: {
        delivery_preferred_date: deliveryPreferredDate,
        next_delivery_date: nextDeliveryDate,
      },
    });

    if (result.count === 0) {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          subscription_id: parsedSubscriptionId,
          customer_id: customerId,
        },
        select: { canceled_date: true },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      throw new BadRequestException(
        'Canceled subscriptions cannot update their preferred delivery date',
      );
    }

    return this.findOne(userId, subscriptionId);
  }

  async cancel(userId: string, subscriptionId: string) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');
    const parsedSubscriptionId = this.parsePositiveInteger(
      subscriptionId,
      'subscription ID',
    );

    await this.prisma.subscription.updateMany({
      where: {
        subscription_id: parsedSubscriptionId,
        customer_id: customerId,
        canceled_date: null,
      },
      data: { canceled_date: new Date() },
    });

    return this.findOne(userId, subscriptionId);
  }

  async processDueSubscriptions(now = new Date()) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        canceled_date: null,
        OR: [
          { next_delivery_date: { lte: now } },
          { next_delivery_date: null },
        ],
      },
      select: { subscription_id: true },
    });

    let createdOrderCount = 0;

    for (const subscription of subscriptions) {
      const created = await this.createNextOrderIfDue(
        subscription.subscription_id,
        now,
      );

      if (created) {
        createdOrderCount += 1;
      }
    }

    return createdOrderCount;
  }

  private async createNextOrderIfDue(
    subscriptionId: number,
    now: Date,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.findUnique({
        where: { subscription_id: subscriptionId },
        include: {
          customer_order: {
            orderBy: { delivery_preferred_date: 'desc' },
            take: 1,
          },
        },
      });

      if (!subscription || subscription.canceled_date) {
        return false;
      }

      const nextDeliveryDate =
        subscription.next_delivery_date ??
        this.calculateNextDeliveryDate(subscription);

      if (nextDeliveryDate > now) {
        if (!subscription.next_delivery_date) {
          await transaction.subscription.updateMany({
            where: {
              subscription_id: subscription.subscription_id,
              canceled_date: null,
              next_delivery_date: null,
            },
            data: { next_delivery_date: nextDeliveryDate },
          });
        }
        return false;
      }

      const claimedNextDeliveryDate = new Date(
        nextDeliveryDate.getTime() + SEVEN_DAYS_IN_MILLISECONDS,
      );
      const claim = await transaction.subscription.updateMany({
        where: {
          subscription_id: subscription.subscription_id,
          canceled_date: null,
          ...(subscription.next_delivery_date
            ? { next_delivery_date: subscription.next_delivery_date }
            : { next_delivery_date: null }),
        },
        data: { next_delivery_date: claimedNextDeliveryDate },
      });

      if (claim.count === 0) {
        return false;
      }

      await transaction.customer_order.create({
        data: {
          customer_id: subscription.customer_id,
          meal_id: subscription.meal_id,
          order_status: 'pending',
          payment_status: 'unpaid',
          delivery_status: 'not_dispatched',
          delivery_preferred_date: nextDeliveryDate,
          is_a_subscribed_meal: true,
          subscription_id: subscription.subscription_id,
        },
      });

      return true;
    });
  }

  private calculateNextDeliveryDate(subscription: {
    delivery_preferred_date: Date;
    customer_order: { delivery_preferred_date: Date }[];
  }) {
    const latestOrderDate =
      subscription.customer_order[0]?.delivery_preferred_date;
    const anchorDate = latestOrderDate ?? subscription.delivery_preferred_date;

    return new Date(anchorDate.getTime() + SEVEN_DAYS_IN_MILLISECONDS);
  }

  private parsePositiveInteger(value: string, fieldName: string) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return parsedValue;
  }

  private subscriptionDetailsInclude() {
    return {
      meal_plan: true,
      customer_order: {
        orderBy: { delivery_preferred_date: 'asc' as const },
      },
    };
  }
}
