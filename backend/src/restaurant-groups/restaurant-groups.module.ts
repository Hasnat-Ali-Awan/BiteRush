import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RestaurantGroup,
  RestaurantGroupSchema,
} from './schemas/restaurant-group.schema';
import { RestaurantGroupsService } from './restaurant-groups.service';
import { RestaurantGroupsController } from './restaurant-groups.controller';
import { UsersModule } from '../users/users.module';
import { Restaurant, RestaurantSchema } from '../restaurants/schemas/restaurant.schema';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RestaurantGroup.name, schema: RestaurantGroupSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    UsersModule,
    AccessModule,
  ],
  controllers: [RestaurantGroupsController],
  providers: [RestaurantGroupsService],
  exports: [RestaurantGroupsService],
})
export class RestaurantGroupsModule {}
