import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'assigned',
  'picked_up',
  'on_the_way',
  'delivered',
  'rejected',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderLocationPoint {
  @Prop({ default: 0 })
  lat: number;

  @Prop({ default: 0 })
  lng: number;
}

const OrderLocationPointSchema =
  SchemaFactory.createForClass(OrderLocationPoint);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  customerId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  riderId: Types.ObjectId | null;

  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ default: '' })
  deliveryAddress: string;

  @Prop({ type: OrderLocationPointSchema, default: null })
  deliveryLocation: OrderLocationPoint | null;

  @Prop({ type: OrderLocationPointSchema, default: null })
  restaurantLocation: OrderLocationPoint | null;

  @Prop({ type: OrderLocationPointSchema, default: null })
  riderCurrentLocation: OrderLocationPoint | null;

  @Prop({ type: Date, default: null })
  riderLocationUpdatedAt: Date | null;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ required: true })
  total: number;

  @Prop({
    required: true,
    enum: ORDER_STATUSES,
    default: 'pending',
    index: true,
  })
  status: OrderStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, status: 1, riderId: 1 });
OrderSchema.index({ riderId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

