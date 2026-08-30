import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CustomerOrderService } from './customer_order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users/:userId/orders')
@UseGuards(JwtAuthGuard)
export class CustomerOrderController {
  constructor(private readonly customerOrderService: CustomerOrderService) {}

  @Post()
  async create(
    @Param('userId') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.customerOrderService.create(userId, createOrderDto);
  }

  @Get()
  async findAllByUser(@Param('userId') userId: string) {
    return this.customerOrderService.findAllByUser(userId);
  }

  @Get(':orderId')
  async findOneByUser(
    @Param('userId') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.customerOrderService.findOneByUser(userId, orderId);
  }

  @Patch(':orderId')
  async updateByUser(
    @Param('userId') userId: string,
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.customerOrderService.updateByUser(
      userId,
      orderId,
      updateOrderDto,
    );
  }
}
