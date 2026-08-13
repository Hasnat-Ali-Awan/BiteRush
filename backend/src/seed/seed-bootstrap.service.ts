import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import { SeedService } from './seed.service';

@Injectable()
export class SeedBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SeedBootstrapService.name);

  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly seedService: SeedService,
  ) {}

  async onModuleInit() {
    const count = await this.restaurantModel.countDocuments();
    if (count === 0) {
      const result = await this.seedService.run();
      this.logger.log(`Auto-seeded demo data (${result.orders} orders)`);
    }
  }
}
