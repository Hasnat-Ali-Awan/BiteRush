import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  RestaurantGroup,
  RestaurantGroupDocument,
} from './schemas/restaurant-group.schema';
import {
  CreateBranchDto,
  CreateRestaurantGroupDto,
  InviteStaffDto,
  UpdateBranchDto,
} from './dto/restaurant-group.dto';
import { UsersService } from '../users/users.service';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import { MailService } from '../mail/mail.service';
import { AccessScopeService } from '../access/access-scope.service';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { MenuItem, MenuItemDocument } from '../menu/schemas/menu-item.schema';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class RestaurantGroupsService {
  constructor(
    @InjectModel(RestaurantGroup.name)
    private readonly groupModel: Model<RestaurantGroupDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly accessScope: AccessScopeService,
  ) {}

  async createGroup(dto: CreateRestaurantGroupDto, ownerId: string) {
    const existing = await this.groupModel.findOne({ ownerId }).lean();
    if (existing) {
      throw new ConflictException('You already have a restaurant brand');
    }

    const group = await this.groupModel.create({
      name: dto.name.trim(),
      ownerId,
      cuisine: dto.cuisine?.trim() ?? '',
      heroImage: dto.heroImage?.trim() ?? '',
      description: dto.description?.trim() ?? '',
    });

    await this.usersService.setGroupId(ownerId, String(group._id));
    return this.mapGroup(group.toObject());
  }

  async getMyGroup(ownerId: string) {
    const group = await this.groupModel.findOne({ ownerId }).lean();
    if (!group) return null;
    return this.mapGroup(group);
  }

  async listBranchesForOwner(ownerId: string) {
    const group = await this.groupModel.findOne({ ownerId }).lean();
    if (!group) return [];
    const branches = await this.restaurantModel
      .find({ groupId: group._id })
      .sort({ createdAt: 1 })
      .lean();
    return branches.map((branch) => this.mapBranch(branch, group));
  }

  async createBranch(groupId: string, dto: CreateBranchDto, ownerId: string) {
    const group = await this.accessScope.assertGroupOwner(ownerId, groupId);
    const branchName = dto.branch.trim();

    // Check for duplicate branch name in this group
    const existingBranch = await this.restaurantModel.findOne({
      groupId: group._id,
      branch: {
        $regex: new RegExp(`^${branchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      },
    });
    if (existingBranch) {
      throw new ConflictException(`A branch named "${branchName}" already exists in your brand.`);
    }

    // Validate location if provided
    let location = dto.location ?? null;
    if (location && (typeof location.lat === 'number' || typeof location.lng === 'number')) {
      if (
        !Number.isFinite(location.lat) ||
        !Number.isFinite(location.lng) ||
        location.lat < -90 ||
        location.lat > 90 ||
        location.lng < -180 ||
        location.lng > 180
      ) {
        throw new BadRequestException('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
      }
    }

    const branch = await this.restaurantModel.create({
      groupId: group._id,
      name: group.name,
      branch: branchName,
      address: dto.address.trim(),
      location: location ?? { lat: 0, lng: 0 },
      cuisine: group.cuisine,
      eta: dto.eta?.trim() ?? '',
      heroImage: dto.heroImage?.trim() || group.heroImage,
      deliveryFee: Number(dto.deliveryFee ?? 0),
      minOrder: Number(dto.minOrder ?? 0),
      avgRating: 0,
    });
    return this.mapBranch(branch.toObject(), group);
  }

  async updateBranch(
    groupId: string,
    branchId: string,
    dto: UpdateBranchDto,
    ownerId: string,
  ) {
    const group = await this.accessScope.assertGroupOwner(ownerId, groupId);
    const branch = await this.restaurantModel.findById(branchId);
    if (!branch || String(branch.groupId) !== groupId) {
      throw new NotFoundException('Branch not found in your brand');
    }

    if (dto.branch !== undefined) {
      const nextBranchName = dto.branch.trim();
      if (nextBranchName.toLowerCase() !== branch.branch.toLowerCase()) {
        const existingBranch = await this.restaurantModel.findOne({
          groupId: group._id,
          _id: { $ne: branch._id },
          branch: {
            $regex: new RegExp(`^${nextBranchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          },
        });
        if (existingBranch) {
          throw new ConflictException(`A branch named "${nextBranchName}" already exists in your brand.`);
        }
      }
      branch.branch = nextBranchName;
    }

    if (dto.address !== undefined) branch.address = dto.address.trim();
    if (dto.eta !== undefined) branch.eta = dto.eta.trim();
    if (dto.deliveryFee !== undefined) branch.deliveryFee = Number(dto.deliveryFee);
    if (dto.minOrder !== undefined) branch.minOrder = Number(dto.minOrder);
    if (dto.heroImage !== undefined) branch.heroImage = dto.heroImage.trim();

    if (dto.location !== undefined) {
      const loc = dto.location;
      if (loc && (typeof loc.lat === 'number' || typeof loc.lng === 'number')) {
        if (
          !Number.isFinite(loc.lat) ||
          !Number.isFinite(loc.lng) ||
          loc.lat < -90 ||
          loc.lat > 90 ||
          loc.lng < -180 ||
          loc.lng > 180
        ) {
          throw new BadRequestException('Invalid coordinates.');
        }
      }
      branch.location = loc ?? { lat: 0, lng: 0 };
    }

    await branch.save();
    return this.mapBranch(branch.toObject(), group);
  }

  async deleteBranch(groupId: string, branchId: string, ownerId: string) {
    const group = await this.accessScope.assertGroupOwner(ownerId, groupId);
    const branch = await this.restaurantModel.findById(branchId);
    if (!branch || String(branch.groupId) !== groupId) {
      throw new NotFoundException('Branch not found in your brand');
    }

    // Safety validation: verify if there are active in-progress orders
    const activeOrdersCount = await this.orderModel.countDocuments({
      restaurantId: branch._id,
      status: {
        $in: [
          'pending',
          'accepted',
          'preparing',
          'ready',
          'assigned',
          'picked_up',
          'on_the_way',
        ],
      },
    });

    if (activeOrdersCount > 0) {
      throw new ConflictException(
        `Cannot delete branch "${branch.branch}" because it has ${activeOrdersCount} active in-progress order(s). Please complete or cancel them before deleting this branch.`,
      );
    }

    // Cascade delete related records & clean references
    await Promise.all([
      this.restaurantModel.findByIdAndDelete(branch._id),
      this.menuItemModel.deleteMany({ restaurantId: branch._id }),
      this.reservationModel.deleteMany({ restaurantId: branch._id }),
      this.userModel.updateMany(
        { restaurantId: branch._id },
        { $set: { restaurantId: null } },
      ),
    ]);

    return {
      success: true,
      message: `Branch "${branch.branch}" and all its menu items were deleted successfully.`,
      deletedBranchId: branchId,
    };
  }

  async inviteBranchManager(
    branchId: string,
    dto: InviteStaffDto,
    ownerId: string,
  ) {
    const branch = await this.restaurantModel.findById(branchId).lean();
    if (!branch) throw new NotFoundException('Branch not found');
    await this.accessScope.assertGroupOwner(ownerId, String(branch.groupId));

    if (branch.branchManagerId) {
      throw new ConflictException('This branch already has a manager');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const password = randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.usersService.create({
      name: dto.name.trim(),
      email: dto.email.trim(),
      passwordHash,
      role: 'branch_manager',
      restaurantId: String(branch._id),
      isEmailVerified: true,
    });

    await this.restaurantModel.findByIdAndUpdate(branchId, {
      branchManagerId: user._id,
    });

    const mail = await this.mailService.sendInvite({
      to: dto.email.trim(),
      name: dto.name.trim(),
      roleLabel: 'branch manager',
      password,
      branchName: `${branch.name} — ${branch.branch}`,
    });

    return {
      manager: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      email: mail,
    };
  }

  async inviteRider(branchId: string, dto: InviteStaffDto, ownerId: string) {
    const branch = await this.restaurantModel.findById(branchId).lean();
    if (!branch) throw new NotFoundException('Branch not found');
    await this.accessScope.assertGroupOwner(ownerId, String(branch.groupId));

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const password = randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.usersService.create({
      name: dto.name.trim(),
      email: dto.email.trim(),
      passwordHash,
      role: 'rider',
      restaurantId: String(branch._id),
      isEmailVerified: true,
    });

    const mail = await this.mailService.sendInvite({
      to: dto.email.trim(),
      name: dto.name.trim(),
      roleLabel: 'delivery rider',
      password,
      branchName: `${branch.name} — ${branch.branch}`,
    });

    return {
      rider: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: String(branch._id),
      },
      email: mail,
    };
  }

  private mapGroup(group: any) {
    return {
      id: String(group._id),
      name: group.name,
      cuisine: group.cuisine,
      heroImage: group.heroImage,
      description: group.description,
    };
  }

  private mapBranch(branch: any, group?: any) {
    return {
      id: String(branch._id),
      groupId: String(branch.groupId),
      name: branch.name,
      branch: branch.branch,
      address: branch.address,
      location: branch.location ?? null,
      branchManagerId: branch.branchManagerId
        ? String(branch.branchManagerId)
        : null,
      avgRating: branch.avgRating,
      cuisine: branch.cuisine || group?.cuisine || '',
      eta: branch.eta,
      heroImage: branch.heroImage,
      deliveryFee: branch.deliveryFee,
      minOrder: branch.minOrder,
    };
  }
}
