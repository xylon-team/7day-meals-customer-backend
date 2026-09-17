import {
  Controller,
  Get,
  Post,
  Body,
  ForbiddenException,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerOrderService } from './customer_order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePrefDeliveryDateDto } from './dto/update-pref-delivery-date.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users/:userId/orders')
@UseGuards(JwtAuthGuard)
export class CustomerOrderController {
  constructor(private readonly customerOrderService: CustomerOrderService) {}

  @Post()
  async create(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.customerOrderService.create(userId, createOrderDto);
  }

  @Get()
  async findAllByUser(@Req() req: any, @Param('userId') userId: string) {
    this.assertAuthenticatedUser(req, userId);
    return this.customerOrderService.findAllByUser(userId);
  }

  @Get(':orderId')
  async findOneByUser(
    @Req() req: any,
    @Param('userId') userId: string,
    @Param('orderId') orderId: string,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.customerOrderService.findOneByUser(userId, orderId);
  }

  @Patch(':orderId/pref-delivery-date')
  async updatePrefDeliveryDate(
    @Req() req: any,
    @Param('userId') userId: string,
    @Param('orderId') orderId: string,
    @Body() updatePrefDeliveryDateDto: UpdatePrefDeliveryDateDto,
  ) {
    this.assertAuthenticatedUser(req, userId);
    return this.customerOrderService.updatePrefDeliveryDate(
      userId,
      orderId,
      updatePrefDeliveryDateDto,
    );
  }

  private assertAuthenticatedUser(req: any, userId: string) {
    if (Number(userId) !== req.user.customer_id) {
      throw new ForbiddenException('You can only access your own orders');
    }
  }
}
