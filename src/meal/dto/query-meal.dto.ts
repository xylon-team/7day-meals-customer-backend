import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMealDto {
  // ============= Meal Plan Query Filters =============
  // Free-text search against meal plan name and description.
  @IsOptional()
  @IsString()
  search?: string;

  // Filter by category, such as Breakfast, Lunch, or Dinner.
  @IsOptional()
  @IsString()
  category?: string;

  // Filter by dietary preference, such as Vegan or Vegetarian.
  @IsOptional()
  @IsString()
  dietary_preference?: string;

  // Minimum meal plan price, inclusive.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  // Maximum meal plan price, inclusive.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;
}
