import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import {
  RestaurantGroup,
  RestaurantGroupDocument,
} from '../restaurant-groups/schemas/restaurant-group.schema';
import type { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(RestaurantGroup.name)
    private readonly groupModel: Model<RestaurantGroupDocument>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    });

    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issue(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account not found');
    return this.issue(user);
  }

  private async issue(user: {
    _id: unknown;
    name: string;
    email: string;
    role: UserRole;
    restaurantId?: unknown;
    groupId?: unknown;
  }) {
    const restaurantId = user.restaurantId ? String(user.restaurantId) : null;
    const groupId = user.groupId ? String(user.groupId) : null;

    const [restaurant, group, branches] = await Promise.all([
      restaurantId
        ? this.restaurantModel.findById(restaurantId).lean()
        : null,
      groupId ? this.groupModel.findById(groupId).lean() : null,
      groupId
        ? this.restaurantModel.find({ groupId }).sort({ createdAt: 1 }).lean()
        : user.role === 'main_manager'
          ? this.restaurantModel
              .find({
                groupId: (
                  await this.groupModel
                    .findOne({ ownerId: String(user._id) })
                    .lean()
                )?._id,
              })
              .sort({ createdAt: 1 })
              .lean()
          : [],
    ]);

    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };

    return {
      token: await this.jwtService.signAsync(payload),
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId,
        groupId: group ? String(group._id) : groupId,
        restaurant: restaurant
          ? {
              id: String(restaurant._id),
              name: restaurant.name,
              branch: restaurant.branch,
              address: restaurant.address,
            }
          : null,
        group: group
          ? {
              id: String(group._id),
              name: group.name,
              cuisine: group.cuisine,
            }
          : null,
        branches: (branches || []).map((branch) => ({
          id: String(branch._id),
          name: branch.name,
          branch: branch.branch,
          address: branch.address,
          branchManagerId: branch.branchManagerId
            ? String(branch.branchManagerId)
            : null,
        })),
      },
    };
  }
}
