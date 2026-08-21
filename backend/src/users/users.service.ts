import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    restaurantId?: string | null;
    groupId?: string | null;
  }) {
    return this.userModel.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      role: data.role,
      restaurantId: data.restaurantId ?? null,
      groupId: data.groupId ?? null,
    });
  }

  async setRestaurantId(userId: string, restaurantId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { restaurantId },
        { returnDocument: 'after' },
      )
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setGroupId(userId: string, groupId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { groupId }, { returnDocument: 'after' })
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
