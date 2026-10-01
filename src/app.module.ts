import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerOrderModule } from './customer_order/customer_order.module';
import { CustomerModule } from './customer/customer.module';
import { MealModule } from './meal/meal.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';
import { InquiryModule } from './inquiry/inquiry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CustomerOrderModule,
    CustomerModule,
    MealModule,
    SubscriptionModule,
    NotificationModule,
    ReviewModule,
    InquiryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
