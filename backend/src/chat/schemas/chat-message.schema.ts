import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

export const CHAT_SENDER_ROLES = [
  'customer',
  'rider',
  'manager',
  'system',
] as const;

export type ChatSenderRole = (typeof CHAT_SENDER_ROLES)[number];

export const CHAT_MESSAGE_TYPES = [
  'text',
  'image',
  'location',
  'system',
] as const;

export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number];

@Schema({ _id: false })
export class ChatLocation {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ default: '' })
  address?: string;
}

export const ChatLocationSchema = SchemaFactory.createForClass(ChatLocation);

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  senderId: Types.ObjectId | null;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true, enum: CHAT_SENDER_ROLES, type: String })
  senderRole: ChatSenderRole;

  @Prop({ default: '' })
  text: string;

  @Prop({ required: true, enum: CHAT_MESSAGE_TYPES, default: 'text' })
  type: ChatMessageType;

  @Prop({ default: null })
  imageUrl: string | null;

  @Prop({ type: ChatLocationSchema, default: null })
  location: ChatLocation | null;

  @Prop({ type: [String], default: [] })
  mentions: string[];
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ orderId: 1, createdAt: 1 });
