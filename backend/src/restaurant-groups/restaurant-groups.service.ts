import {
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
} from './dto/restaurant-group.dto';
import { UsersService } from '../users/users.service';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import { MailService } from '../mail/mail.service';
import { AccessScopeService } from '../access/access-scope.service';

@Injectable()
export class RestaurantGroupsService {
  constructor(
    @InjectModel(RestaurantGroup.name)
    private readonly groupModel: Model<RestaurantGroupDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
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
      cuisine: dto.cuisine ?? '',
      heroImage: dto.heroImage ?? '',
      description: dto.description ?? '',
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
    const branch = await this.restaurantModel.create({
      groupId: group._id,
      name: group.name,
      branch: dto.branch.trim(),
      address: dto.address ?? '',
      location: dto.location ?? { lat: 0, lng: 0 },
      cuisine: group.cuisine,
      eta: dto.eta ?? '',
      heroImage: dto.heroImage || group.heroImage,
      deliveryFee: dto.deliveryFee ?? 0,
      minOrder: dto.minOrder ?? 0,
      avgRating: 0,
    });
    return this.mapBranch(branch.toObject(), group);
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
