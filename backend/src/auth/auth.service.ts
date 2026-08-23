import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import {
  RestaurantGroup,
  RestaurantGroupDocument,
} from '../restaurant-groups/schemas/restaurant-group.schema';
import { MailService } from '../mail/mail.service';
import type { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(RestaurantGroup.name)
    private readonly groupModel: Model<RestaurantGroupDocument>,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationCode = this.generateOtp();
    const verificationToken = this.generateToken();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    });

    await this.mailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      token: verificationToken,
    });

    return {
      message:
        'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      email: user.email,
    };
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

    if (user.isEmailVerified === false) {
      throw new UnauthorizedException({
        message: 'Please verify your email address before logging in.',
        email: user.email,
        requiresVerification: true,
      });
    }

    return this.issue(user);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    let user = null;

    if (dto.token) {
      user = await this.usersService.findByVerificationToken(dto.token);
    } else if (dto.email && dto.code) {
      const candidate = await this.usersService.findByEmail(dto.email);
      if (
        candidate &&
        candidate.emailVerificationCode &&
        candidate.emailVerificationCode.trim() === dto.code.trim()
      ) {
        user = candidate;
      }
    } else {
      throw new BadRequestException(
        'Please provide either a verification link or a 6-digit code with your email.',
      );
    }

    if (!user) {
      // Check if user is already verified
      if (dto.email) {
        const candidate = await this.usersService.findByEmail(dto.email);
        if (candidate && candidate.isEmailVerified) {
          return this.issue(candidate);
        }
      }
      throw new BadRequestException(
        'Invalid or expired verification code / link.',
      );
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new code.',
      );
    }

    const updatedUser = await this.usersService.markEmailVerified(
      String(user._id),
    );

    return this.issue(updatedUser ?? user);
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return {
        message:
          'If an unverified account exists with that email, a verification code has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return {
        message: 'This account is already verified. You can sign in now.',
        alreadyVerified: true,
      };
    }

    const code = this.generateOtp();
    const token = this.generateToken();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.setVerificationData(String(user._id), {
      emailVerificationToken: token,
      emailVerificationCode: code,
      emailVerificationExpires: expires,
    });

    await this.mailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      code,
      token,
    });

    return {
      message: 'A fresh verification code has been sent to your email.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      const code = this.generateOtp();
      const token = this.generateToken();
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      await this.usersService.setResetPasswordData(String(user._id), {
        resetPasswordToken: token,
        resetPasswordCode: code,
        resetPasswordExpires: expires,
      });

      await this.mailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        code,
        token,
      });
    }

    return {
      message:
        'If an account exists with that email address, password reset instructions have been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let user = null;

    if (dto.token) {
      user = await this.usersService.findByResetPasswordToken(dto.token);
    } else if (dto.email && dto.code) {
      const candidate = await this.usersService.findByEmail(dto.email);
      if (
        candidate &&
        candidate.resetPasswordCode &&
        candidate.resetPasswordCode.trim() === dto.code.trim()
      ) {
        user = candidate;
      }
    } else {
      throw new BadRequestException(
        'Please provide a password reset link or a 6-digit reset code.',
      );
    }

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired password reset link/code.',
      );
    }

    if (
      user.resetPasswordExpires &&
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Password reset code/link has expired. Please request a new one.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePasswordAndClearReset(
      String(user._id),
      passwordHash,
    );

    return {
      message:
        'Your password has been successfully reset! You can now log in with your new password.',
    };
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
