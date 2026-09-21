import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePrefDeliveryDateDto } from './dto/update-pref-delivery-date.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      return await this.prisma.customer_order.create({
        data: {
          ...createOrderDto,
          customer_id: parseInt(userId),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Order already exists with the provided details',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid customer ID or related entity not found',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Related record not found');
        }
        throw new BadRequestException(`Invalid order data: ${error.message}`);
      }
      throw new InternalServerErrorException(
        'Failed to create order: An unexpected error occurred',
      );
    }
  }

  async findAllByUser(userId: string) {
    try {
      const orders = await this.prisma.customer_order.findMany({
        where: {
          customer_id: parseInt(userId),
        },
      });
      return orders;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          `Failed to fetch orders: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to fetch orders: An unexpected error occurred',
      );
    }
  }

  // ============= Authenticated Customer Order History =============
  async findOrderHistory(userId: string) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');

    return this.prisma.customer_order.findMany({
      where: { customer_id: customerId },
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
  }

  async findOneByUser(userId: string, orderId: string) {
    try {
      const order = await this.prisma.customer_order.findFirst({
        where: {
          order_id: parseInt(orderId),
          customer_id: parseInt(userId),
        },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          `Failed to fetch order: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to fetch order: An unexpected error occurred',
      );
    }
  }

  async updatePrefDeliveryDate(
    userId: string,
    orderId: string,
    updatePrefDeliveryDateDto: UpdatePrefDeliveryDateDto,
  ) {
    try {
      const result = await this.prisma.customer_order.updateMany({
        where: {
          order_id: parseInt(orderId),
          customer_id: parseInt(userId),
        },
        data: {
          delivery_preferred_date: new Date(
            updatePrefDeliveryDateDto.delivery_preferred_date,
          ),
        },
      });
      if (result.count === 0) {
        throw new NotFoundException(
          'Order not found or you do not have permission to update its preferred delivery date',
        );
      }
      return await this.prisma.customer_order.findFirst({
        where: {
          order_id: parseInt(orderId),
          customer_id: parseInt(userId),
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Order update conflicts with existing data',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid reference: related entity not found',
          );
        }
        throw new BadRequestException(
          `Failed to update order: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to update order: An unexpected error occurred',
      );
    }
  }

  // ============= Customer Order Status Update Notification =============
  async updateStatus(
    userId: string,
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const customerId = this.parsePositiveInteger(userId, 'customer ID');
    const parsedOrderId = this.parsePositiveInteger(orderId, 'order ID');

    if (
      updateOrderStatusDto.order_status === undefined &&
      updateOrderStatusDto.payment_status === undefined &&
      updateOrderStatusDto.delivery_status === undefined
    ) {
      throw new BadRequestException(
        'At least one order status field must be provided',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.customer_order.findFirst({
        where: {
          order_id: parsedOrderId,
          customer_id: customerId,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const changes = this.getStatusChanges(order, updateOrderStatusDto);
      if (changes.length === 0) {
        return order;
      }

      await transaction.customer_order.updateMany({
        where: {
          order_id: parsedOrderId,
          customer_id: customerId,
        },
        data: updateOrderStatusDto,
      });

      // --------------------- Status change notification ------------------
      await transaction.notification.create({
        data: {
          customer_id: customerId,
          title: 'Order status updated',
          message: `Order #${parsedOrderId} update: ${changes.join('; ')}.`,
          type: 'order',
        },
      });

      return transaction.customer_order.findFirst({
        where: {
          order_id: parsedOrderId,
          customer_id: customerId,
        },
      });
    });
  }

  // --------------------- Order status change detection ------------------
  private getStatusChanges(
    order: {
      order_status: string;
      payment_status: string;
      delivery_status: string;
    },
    updates: UpdateOrderStatusDto,
  ): string[] {
    const changes: string[] = [];

    if (
      updates.order_status !== undefined &&
      updates.order_status !== order.order_status
    ) {
      changes.push(`Order status changed to ${updates.order_status}`);
    }

    if (
      updates.payment_status !== undefined &&
      updates.payment_status !== order.payment_status
    ) {
      changes.push(`Payment status changed to ${updates.payment_status}`);
    }

    if (
      updates.delivery_status !== undefined &&
      updates.delivery_status !== order.delivery_status
    ) {
      changes.push(`Delivery status changed to ${updates.delivery_status}`);
    }

    return changes;
  }

  // --------------------- Path parameter validation ------------------
  private parsePositiveInteger(value: string, fieldName: string): number {
    const parsedValue = Number(value);

    if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return parsedValue;
  }
}
