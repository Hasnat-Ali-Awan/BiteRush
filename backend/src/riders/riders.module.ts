import { Module } from '@nestjs/common';
import { RidersController } from './riders.controller';
import { OrdersModule } from '../orders/orders.module';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [OrdersModule, AccessModule],
  controllers: [RidersController],
})
export class RidersModule {}
