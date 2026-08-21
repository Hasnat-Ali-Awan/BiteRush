import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RestaurantGroupDocument = HydratedDocument<RestaurantGroup>;

@Schema({ timestamps: true })
export class RestaurantGroup {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  ownerId: Types.ObjectId;

  @Prop({ default: '' })
  cuisine: string;

  @Prop({ default: '' })
  heroImage: string;

  @Prop({ default: '' })
  description: string;
}

export const RestaurantGroupSchema =
  SchemaFactory.createForClass(RestaurantGroup);
