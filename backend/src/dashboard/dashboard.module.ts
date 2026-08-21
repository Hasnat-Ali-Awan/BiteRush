import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Restaurant,
  RestaurantSchema,
} from '../restaurants/schemas/restaurant.schema';
import {
  RestaurantGroup,
  RestaurantGroupSchema,
} from '../restaurant-groups/schemas/restaurant-group.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  Reservation,
  ReservationSchema,
} from '../reservations/schemas/reservation.schema';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: RestaurantGroup.name, schema: RestaurantGroupSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    AccessModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
