import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerOrderModule } from './customer_order/customer_order.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [CustomerOrderModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
