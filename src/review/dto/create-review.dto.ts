import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  order_id: number;

  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating_value: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Review must be 500 characters or less' })
  description?: string;
}
