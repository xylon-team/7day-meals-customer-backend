import { Controller, Get, Param, Query } from '@nestjs/common';
import { MealService } from './meal.service';
import { QueryMealDto } from './dto/query-meal.dto';

@Controller('meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  // ============= Available Meal Plan Retrieval =============
  @Get()
  findAll(@Query() query: QueryMealDto) {
    return this.mealService.findAll(query);
  }

  // ============= Available Meal Plan Search =============
  @Get('search')
  search(@Query() query: QueryMealDto) {
    return this.mealService.findAll(query);
  }

  // ============= Available Meal Plan Filtering =============
  @Get('filter')
  filter(@Query() query: QueryMealDto) {
    return this.mealService.findAll(query);
  }

  // ============= Available Meal Plan Details =============
  @Get(':mealId')
  findOne(@Param('mealId') mealId: string) {
    return this.mealService.findOneById(mealId);
  }
}
