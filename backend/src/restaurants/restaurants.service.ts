import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { AccessScopeService } from '../access/access-scope.service';
import { MemoryCacheService } from '../common/cache/memory-cache.service';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly accessScope: AccessScopeService,
    private readonly cache: MemoryCacheService,
  ) {}

  async findAll() {
    const cached = this.cache.get<any[]>('restaurants:all');
    if (cached) return cached;

    const restaurants = await this.restaurantModel.find().sort({ name: 1 }).lean();
    const result = restaurants.map((restaurant) => this.map(restaurant));
    this.cache.set('restaurants:all', result, 5);
    return result;
  }

  async findOne(id: string) {
    const restaurant = await this.restaurantModel.findById(id).lean();
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return this.map(restaurant);
  }

  async findForManager(userId: string, role: string) {
    const ids = await this.accessScope.getAccessibleRestaurantIds({
      userId,
      role: role as any,
    });
    if (!ids.length) return null;
    const restaurants = await this.restaurantModel
      .find(this.accessScope.buildRestaurantFilter(ids))
      .lean();
    return restaurants.map((restaurant) => this.map(restaurant));
  }

  private map(restaurant: any) {
    return {
      id: String(restaurant._id),
      groupId: String(restaurant.groupId),
      name: restaurant.name,
      branch: restaurant.branch,
      address: restaurant.address,
      location: restaurant.location ?? null,
      branchManagerId: restaurant.branchManagerId
        ? String(restaurant.branchManagerId)
        : null,
      avgRating: restaurant.avgRating,
      cuisine: restaurant.cuisine,
      eta: restaurant.eta,
      heroImage: restaurant.heroImage,
      deliveryFee: restaurant.deliveryFee,
      minOrder: restaurant.minOrder,
    };
  }
}
