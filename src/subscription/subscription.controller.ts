import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionPrefDeliveryDateDto } from './dto/update-subscription-pref-delivery-date.dto';
import { SubscriptionService } from './subscription.service';

type AuthenticatedRequest = {
  user: {
    customer_id: number;
  };
};

@Controller('users/:userId/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.subscriptionService.create(userId, createSubscriptionDto);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.subscriptionService.findAll(userId);
  }

  @Get(':subscriptionId')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.subscriptionService.findOne(userId, subscriptionId);
  }

  @Patch(':subscriptionId/pref-delivery-date')
  async updatePrefDeliveryDate(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body()
    updateSubscriptionPrefDeliveryDateDto: UpdateSubscriptionPrefDeliveryDateDto,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.subscriptionService.updatePrefDeliveryDate(
      userId,
      subscriptionId,
      updateSubscriptionPrefDeliveryDateDto,
    );
  }

  @Patch(':subscriptionId/cancel')
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.subscriptionService.cancel(userId, subscriptionId);
  }

  private assertAuthenticatedUser(req: AuthenticatedRequest, userId: string) {
    if (Number(userId) !== req.user.customer_id) {
      throw new ForbiddenException(
        'You can only access your own subscriptions',
      );
    }
  }
}
