import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuItemDocument = HydratedDocument<MenuItem>;

@Schema({ _id: false })
export class MenuVariant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  priceDelta: number;
}

@Schema({ _id: false })
export class MenuExtra {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number;
}

const MenuVariantSchema = SchemaFactory.createForClass(MenuVariant);
const MenuExtraSchema = SchemaFactory.createForClass(MenuExtra);

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true,
  })
  restaurantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [MenuVariantSchema], default: [] })
  variants: MenuVariant[];

  @Prop({ type: [MenuExtraSchema], default: [] })
  extras: MenuExtra[];

  @Prop({ default: 0, min: 0, max: 90 })
  discountPercent: number;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: 0 })
  orderCount: number;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.index({ restaurantId: 1, categoryId: 1, isAvailable: 1 });
MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
MenuItemSchema.index({ restaurantId: 1, orderCount: -1 });
MenuItemSchema.index({ restaurantId: 1, createdAt: -1 });
MenuItemSchema.index({ restaurantId: 1, name: 'text' });
