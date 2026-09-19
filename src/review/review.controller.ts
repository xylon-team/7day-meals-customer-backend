import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = {
  user: { customer_id: number };
};

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ─── POST /reviews — Submit a review (JWT required) ───────────────────────
  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  submitReview(
    @Req() req: AuthenticatedRequest,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewService.submitReview(
      req.user.customer_id,
      createReviewDto,
    );
  }

  // ─── GET /meals/:mealId/reviews — Public: get reviews for a meal ──────────
  @Get('meals/:mealId/reviews')
  getReviewsByMealId(@Param('mealId') mealId: string) {
    return this.reviewService.getReviewsByMealId(mealId);
  }

  // ─── GET /users/:userId/orders/:orderId/review — Check if reviewed ─────────
  @Get('users/:userId/orders/:orderId/review')
  @UseGuards(JwtAuthGuard)
  getReviewByOrderId(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Param('orderId') orderId: string,
  ) {
    // Ensure the authenticated user matches the userId param
    if (Number(userId) !== req.user.customer_id) {
      throw new ForbiddenException('You can only access your own reviews');
    }
    return this.reviewService.getReviewByOrderId(req.user.customer_id, orderId);
  }
}
