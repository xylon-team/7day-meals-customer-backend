import { Module } from '@nestjs/common';
import { CustomerOrderController } from './customer_order.controller';
import { CustomerOrderService } from './customer_order.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CustomerOrderController],
  providers: [CustomerOrderService, PrismaService],
  exports: [CustomerOrderService],
})
export class CustomerOrderModule {}
