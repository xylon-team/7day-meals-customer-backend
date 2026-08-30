import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMealDto } from './dto/query-meal.dto';

@Injectable()
export class MealService {
  constructor(private readonly prisma: PrismaService) {}

  // ============= Available Meal Plan Retrieval =============
  async findAll(query: QueryMealDto) {
    const { search, category, dietary_preference, min_price, max_price } =
      query;

    if (
      min_price !== undefined &&
      max_price !== undefined &&
      min_price > max_price
    ) {
      throw new BadRequestException(
        'Minimum price cannot be greater than maximum price',
      );
    }

    const where = this.buildAvailableMealPlanWhere({
      search: search?.trim(),
      category: category?.trim(),
      dietary_preference: dietary_preference?.trim(),
      min_price,
      max_price,
    });

    const meals = await this.prisma.meal_plan.findMany({
      where,
      select: {
        meal_id: true,
        item_name: true,
        category: true,
        description: true,
        dietary_preference: true,
        price: true,
        image_path: true,
        is_available: true,
      },
      orderBy: { item_name: 'asc' },
    });

    return meals;
  }

  // ============= Available Meal Plan Details =============
  async findOneById(mealId: string) {
    const id = Number(mealId);
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Invalid meal ID: must be a number');
    }

    const meal = await this.prisma.meal_plan.findFirst({
      where: { meal_id: id, is_available: true },
      include: {
        meal_plan_food_item: {
          where: {
            food_item: {
              is_available: true,
            },
          },
          include: {
            food_item: {
              select: {
                food_item_id: true,
                item_name: true,
                ingredient_list: true,
                image_path: true,
                price: true,
                is_available: true,
              },
            },
          },
        },
      },
    });

    if (!meal) {
      throw new NotFoundException(`Meal plan with ID ${id} not found`);
    }

    return meal;
  }

  // ============= Meal Plan Query Builder =============
  private buildAvailableMealPlanWhere(
    query: QueryMealDto,
  ): Prisma.meal_planWhereInput {
    const { search, category, dietary_preference, min_price, max_price } =
      query;

    return {
      is_available: true,
      ...(search && {
        OR: [
          { item_name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && {
        category: { equals: category, mode: 'insensitive' },
      }),
      ...(dietary_preference && {
        dietary_preference: {
          equals: dietary_preference,
          mode: 'insensitive',
        },
      }),
      ...(min_price !== undefined || max_price !== undefined
        ? {
            price: {
              ...(min_price !== undefined && { gte: min_price }),
              ...(max_price !== undefined && { lte: max_price }),
            },
          }
        : {}),
    };
  }
}
