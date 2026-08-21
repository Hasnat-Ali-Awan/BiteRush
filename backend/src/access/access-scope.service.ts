import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import {
  RestaurantGroup,
  RestaurantGroupDocument,
} from '../restaurant-groups/schemas/restaurant-group.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

export type ScopeUser = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class AccessScopeService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(RestaurantGroup.name)
    private readonly groupModel: Model<RestaurantGroupDocument>,
  ) {}

  async getUserRecord(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('Account not found');
    return user;
  }

  async getAccessibleRestaurantIds(user: ScopeUser): Promise<string[]> {
    if (user.role === 'branch_manager' || user.role === 'rider') {
      const record = await this.getUserRecord(user.userId);
      return record.restaurantId ? [String(record.restaurantId)] : [];
    }

    if (user.role === 'main_manager') {
      const group = await this.groupModel.findOne({ ownerId: user.userId }).lean();
      if (!group) return [];
      const branches = await this.restaurantModel
        .find({ groupId: group._id })
        .select('_id')
        .lean();
      return branches.map((branch) => String(branch._id));
    }

    return [];
  }

  async getPrimaryRestaurantId(user: ScopeUser) {
    const ids = await this.getAccessibleRestaurantIds(user);
    if (user.role === 'branch_manager' || user.role === 'rider') {
      return ids[0] ?? null;
    }
    return ids[0] ?? null;
  }

  async assertRestaurantAccess(user: ScopeUser, restaurantId: string) {
    const ids = await this.getAccessibleRestaurantIds(user);
    if (!ids.includes(restaurantId)) {
      throw new ForbiddenException('You cannot access this branch');
    }
    return restaurantId;
  }

  async assertOrderAccess(
    user: ScopeUser,
    order: {
      restaurantId: unknown;
      riderId?: unknown;
      customerId?: unknown;
    },
  ) {
    const restaurantId = String(order.restaurantId);
    if (user.role === 'rider') {
      if (String(order.riderId || '') !== user.userId) {
        throw new ForbiddenException('This delivery is not assigned to you');
      }
      return restaurantId;
    }

    if (user.role === 'customer') {
      if (String(order.customerId || '') !== user.userId) {
        throw new ForbiddenException('You cannot access this order');
      }
      return restaurantId;
    }

    return this.assertRestaurantAccess(user, restaurantId);
  }

  async getGroupForMainManager(userId: string) {
    return this.groupModel.findOne({ ownerId: userId }).lean();
  }

  async assertGroupOwner(userId: string, groupId: string) {
    const group = await this.groupModel.findById(groupId).lean();
    if (!group || String(group.ownerId) !== userId) {
      throw new ForbiddenException('You do not own this restaurant brand');
    }
    return group;
  }

  buildRestaurantFilter(ids: string[]) {
    if (!ids.length) return { _id: new Types.ObjectId('000000000000000000000000') };
    return { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } };
  }
}
