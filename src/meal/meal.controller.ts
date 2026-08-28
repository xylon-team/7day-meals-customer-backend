import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MealService } from './meal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Get(':mealId')
  async findOne(@Param('mealId') mealId: string) {
    return this.mealService.findOneById(mealId);
  }
}
