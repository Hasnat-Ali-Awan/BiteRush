import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Restaurant,
  RestaurantSchema,
} from '../restaurants/schemas/restaurant.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  Reservation,
  ReservationSchema,
} from '../reservations/schemas/reservation.schema';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';
import { MenuItem, MenuItemSchema } from '../menu/schemas/menu-item.schema';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { SeedBootstrapService } from './seed-bootstrap.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: Category.name, schema: CategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService, SeedBootstrapService],
})
export class SeedModule {}
