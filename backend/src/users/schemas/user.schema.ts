import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export const USER_ROLES = [
  'customer',
  'main_manager',
  'branch_manager',
  'rider',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const SELF_REGISTER_ROLES = [
  'customer',
  'main_manager',
  'rider',
] as const;

export const MANAGER_ROLES = ['main_manager', 'branch_manager'] as const;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: USER_ROLES, type: String })
  role: UserRole;

  /** Branch this user manages or delivers for */
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', default: null })
  restaurantId: Types.ObjectId | null;

  /** Restaurant chain owned by a main manager */
  @Prop({ type: Types.ObjectId, ref: 'RestaurantGroup', default: null })
  groupId: Types.ObjectId | null;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, default: null })
  emailVerificationToken: string | null;

  @Prop({ type: String, default: null })
  emailVerificationCode: string | null;

  @Prop({ type: Date, default: null })
  emailVerificationExpires: Date | null;

  @Prop({ type: String, default: null })
  resetPasswordToken: string | null;

  @Prop({ type: String, default: null })
  resetPasswordCode: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
