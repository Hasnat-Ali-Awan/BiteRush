import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RestaurantDocument = HydratedDocument<Restaurant>;

@Schema({ _id: false })
export class LocationPoint {
  @Prop({ default: 0 })
  lat: number;

  @Prop({ default: 0 })
  lng: number;
}

const LocationPointSchema = SchemaFactory.createForClass(LocationPoint);

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({
    type: Types.ObjectId,
    ref: 'RestaurantGroup',
    required: true,
    index: true,
  })
  groupId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  branch: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ type: LocationPointSchema, default: () => ({ lat: 0, lng: 0 }) })
  location: LocationPoint;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  branchManagerId: Types.ObjectId | null;

  @Prop({ default: 0 })
  avgRating: number;

  @Prop({ default: '' })
  cuisine: string;

  @Prop({ default: '' })
  eta: string;

  @Prop({ default: '' })
  heroImage: string;

  @Prop({ default: 0 })
  deliveryFee: number;

  @Prop({ default: 0 })
  minOrder: number;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
RestaurantSchema.index({ groupId: 1, branch: 1 });
RestaurantSchema.index({ branchManagerId: 1 });
RestaurantSchema.index({ cuisine: 1 });
RestaurantSchema.index({ name: 1 });
