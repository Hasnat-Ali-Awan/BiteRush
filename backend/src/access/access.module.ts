import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessScopeService } from './access-scope.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Restaurant, RestaurantSchema } from '../restaurants/schemas/restaurant.schema';
import {
  RestaurantGroup,
  RestaurantGroupSchema,
} from '../restaurant-groups/schemas/restaurant-group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: RestaurantGroup.name, schema: RestaurantGroupSchema },
    ]),
  ],
  providers: [AccessScopeService],
  exports: [AccessScopeService],
})
export class AccessModule {}
