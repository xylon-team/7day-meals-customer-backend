import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionScheduler } from './subscription.scheduler';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [AuthModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionScheduler, PrismaService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
