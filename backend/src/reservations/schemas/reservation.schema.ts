import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  partySize: number;

  @Prop({ required: true })
  reservedAt: Date;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'rejected', 'seated', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
