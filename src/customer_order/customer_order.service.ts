import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePrefDeliveryDateDto } from './dto/update-pref-delivery-date.dto';
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
}
