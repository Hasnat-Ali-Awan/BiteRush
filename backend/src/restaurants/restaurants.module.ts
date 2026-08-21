import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Restaurant, RestaurantSchema } from './schemas/restaurant.schema';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { AccessModule } from '../access/access.module';
import { RestaurantIndexCleanupService } from './index-cleanup.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    AccessModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantIndexCleanupService],
  exports: [RestaurantsService, MongooseModule],
})
export class RestaurantsModule {}
