import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerOrderModule } from './customer_order/customer_order.module';

@Module({
  imports: [CustomerOrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
