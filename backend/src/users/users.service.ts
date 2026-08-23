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
    isEmailVerified?: boolean;
    emailVerificationToken?: string | null;
    emailVerificationCode?: string | null;
    emailVerificationExpires?: Date | null;
  }) {
    return this.userModel.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      role: data.role,
      restaurantId: data.restaurantId ?? null,
      groupId: data.groupId ?? null,
      isEmailVerified: data.isEmailVerified ?? false,
      emailVerificationToken: data.emailVerificationToken ?? null,
      emailVerificationCode: data.emailVerificationCode ?? null,
      emailVerificationExpires: data.emailVerificationExpires ?? null,
    });
  }

  findByVerificationToken(token: string) {
    return this.userModel.findOne({ emailVerificationToken: token });
  }

  findByResetPasswordToken(token: string) {
    return this.userModel.findOne({ resetPasswordToken: token });
  }

  async setVerificationData(
    userId: string,
    data: {
      emailVerificationToken: string | null;
      emailVerificationCode: string | null;
      emailVerificationExpires: Date | null;
    },
  ) {
    return this.userModel.findByIdAndUpdate(userId, data, {
      returnDocument: 'after',
    });
  }

  async markEmailVerified(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
      { returnDocument: 'after' },
    );
  }

  async setResetPasswordData(
    userId: string,
    data: {
      resetPasswordToken: string | null;
      resetPasswordCode: string | null;
      resetPasswordExpires: Date | null;
    },
  ) {
    return this.userModel.findByIdAndUpdate(userId, data, {
      returnDocument: 'after',
    });
  }

  async updatePasswordAndClearReset(userId: string, passwordHash: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordCode: null,
        resetPasswordExpires: null,
        isEmailVerified: true,
      },
      { returnDocument: 'after' },
    );
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
