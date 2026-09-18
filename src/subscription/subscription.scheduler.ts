import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

const DAILY_INTERVAL_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionScheduler.name);
  private interval?: NodeJS.Timeout;

  constructor(private readonly subscriptionService: SubscriptionService) {}

  onModuleInit() {
    void this.processDueSubscriptions();
    this.interval = setInterval(
      () => void this.processDueSubscriptions(),
      DAILY_INTERVAL_IN_MILLISECONDS,
    );
    this.interval.unref();
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async processDueSubscriptions() {
    try {
      const createdOrderCount =
        await this.subscriptionService.processDueSubscriptions();
      this.logger.log(
        `Subscription worker created ${createdOrderCount} recurring order(s)`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to process recurring subscription orders',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
