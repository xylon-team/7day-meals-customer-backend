import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Submit a review for an order ─────────────────────────────────────────
  async submitReview(customerId: number, dto: CreateReviewDto) {
    const orderId = this.parsePositiveInteger(String(dto.order_id), 'order ID');

    // 1. Verify order belongs to this customer
    const order = await this.prisma.customer_order.findFirst({
      where: { order_id: orderId, customer_id: customerId },
    });

    if (!order) {
      throw new ForbiddenException(
        'Order not found or does not belong to you',
      );
    }

    // 2. Validate order is delivered
    if (order.order_status.toLowerCase() !== 'delivered') {
      throw new BadRequestException(
        'You can only review delivered orders',
      );
    }

    // 3. Check for duplicate review
    const existing = await this.prisma.delivery_feedback.findFirst({
      where: { order_id: orderId },
    });

    if (existing) {
      throw new ConflictException(
        'You have already submitted a review for this order',
      );
    }

    // 4. Create the review
    try {
      const review = await this.prisma.delivery_feedback.create({
        data: {
          order_id: orderId,
          rating_value: dto.rating_value,
          description: dto.description ?? null,
        },
      });
      return review;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid order reference');
        }
      }
      throw new InternalServerErrorException('Failed to submit review');
    }
  }

  // ─── Get all reviews for a meal plan ──────────────────────────────────────
  async getReviewsByMealId(mealId: string) {
    const parsedMealId = this.parsePositiveInteger(mealId, 'meal ID');

    // Verify meal exists
    const meal = await this.prisma.meal_plan.findUnique({
      where: { meal_id: parsedMealId },
    });
    if (!meal) {
      throw new NotFoundException('Meal plan not found');
    }

    const feedbacks = await this.prisma.delivery_feedback.findMany({
      where: {
        customer_order: {
          meal_id: parsedMealId,
        },
      },
      include: {
        customer_order: {
          include: {
            customer: {
              select: { fname: true, lname: true },
            },
          },
        },
      },
      orderBy: { feedback_id: 'desc' },
    });

    // Shape the response
    return feedbacks.map((fb) => ({
      feedback_id: fb.feedback_id,
      order_id: fb.order_id,
      rating_value: fb.rating_value,
      description: fb.description,
      replied_date: fb.replied_date,
      reply: fb.reply,
      reviewer_name:
        fb.customer_order?.customer
          ? `${fb.customer_order.customer.fname} ${fb.customer_order.customer.lname.charAt(0)}.`
          : 'Anonymous',
      created_at: fb.customer_order?.order_timestamp ?? null,
    }));
  }

  // ─── Get review for a specific order (check if already reviewed) ───────────
  async getReviewByOrderId(customerId: number, orderId: string) {
    const parsedOrderId = this.parsePositiveInteger(orderId, 'order ID');

    // Verify order belongs to customer
    const order = await this.prisma.customer_order.findFirst({
      where: { order_id: parsedOrderId, customer_id: customerId },
    });
    if (!order) {
      throw new ForbiddenException('Order not found or does not belong to you');
    }

    const review = await this.prisma.delivery_feedback.findFirst({
      where: { order_id: parsedOrderId },
    });

    if (!review) {
      throw new NotFoundException('No review found for this order');
    }

    return review;
  }

  // ─── Helper ───────────────────────────────────────────────────────────────
  private parsePositiveInteger(value: string, fieldName: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }
    return parsed;
  }
}
