import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';

/**
 * DEV/MIGRATION helper:
 * older iterations used `ownerId` with a unique index on the `restaurants` collection.
 * After introducing `groupId` + `branch`, that index must be removed or inserts fail.
 */
@Injectable()
export class RestaurantIndexCleanupService implements OnModuleInit {
  private readonly logger = new Logger(RestaurantIndexCleanupService.name);

  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.restaurantModel.collection.dropIndex('ownerId_1');
      this.logger.log('Dropped legacy restaurants.ownerId unique index');
    } catch {
      // Ignore: index may not exist (fresh DB) or dropIndex is not allowed.
    }
  }
}
