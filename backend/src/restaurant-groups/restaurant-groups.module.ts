import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RestaurantGroup,
  RestaurantGroupSchema,
} from './schemas/restaurant-group.schema';
import { RestaurantGroupsService } from './restaurant-groups.service';
import { RestaurantGroupsController } from './restaurant-groups.controller';
import { UsersModule } from '../users/users.module';
import {
  Restaurant,
  RestaurantSchema,
} from '../restaurants/schemas/restaurant.schema';
import { AccessModule } from '../access/access.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { MenuItem, MenuItemSchema } from '../menu/schemas/menu-item.schema';
import {
  Reservation,
  ReservationSchema,
} from '../reservations/schemas/reservation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RestaurantGroup.name, schema: RestaurantGroupSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Order.name, schema: OrderSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    AccessModule,
  ],
  controllers: [RestaurantGroupsController],
  providers: [RestaurantGroupsService],
  exports: [RestaurantGroupsService],
})
export class RestaurantGroupsModule {}
