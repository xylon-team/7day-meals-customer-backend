import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MealService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(mealId: string) {
    try {
      const id = parseInt(mealId, 10);
      if (isNaN(id)) {
        throw new BadRequestException('Invalid meal ID: must be a number');
      }

      const meal = await this.prisma.meal_plan.findUnique({
        where: { meal_id: id },
        include: {
          meal_plan_food_item: {
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
        throw new NotFoundException(`Meal with ID ${mealId} not found`);
      }

      return meal;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          `Failed to fetch meal: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to fetch meal: An unexpected error occurred',
      );
    }
  }
}
