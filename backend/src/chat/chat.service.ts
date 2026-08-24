import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  ChatMessage,
  ChatMessageDocument,
  ChatSenderRole,
} from './schemas/chat-message.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import {
  AccessScopeService,
  ScopeUser,
} from '../access/access-scope.service';
import { SendChatMessageDto, UploadChatImageDto } from './dto/chat.dto';

const CLOSED_STATUSES = ['delivered', 'cancelled', 'rejected'];

@Injectable()
export class ChatService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'chat');

  constructor(
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessageDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly accessScope: AccessScopeService,
  ) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async getChat(orderId: string, user: ScopeUser) {
    const order = await this.orderModel.findById(orderId).lean();
    if (!order) throw new NotFoundException('Order not found');

    await this.accessScope.assertOrderAccess(user, order);

    const [restaurant, riderUser, customerUser] = await Promise.all([
      this.restaurantModel.findById(order.restaurantId).lean(),
      order.riderId ? this.userModel.findById(order.riderId).lean() : null,
      order.customerId ? this.userModel.findById(order.customerId).lean() : null,
    ]);

    const isClosed = CLOSED_STATUSES.includes(order.status);

    let messages = await this.chatMessageModel
      .find({ orderId: new Types.ObjectId(orderId) })
      .sort({ createdAt: 1 })
      .lean();

    // Auto-seed welcoming system message if no chat exists yet
    if (messages.length === 0) {
      const welcome = await this.chatMessageModel.create({
        orderId: order._id,
        senderId: null,
        senderName: 'BiteRush Order Group',
        senderRole: 'system',
        text: `Order #${order.orderNumber} placed. Customer, Rider, and Kitchen Manager can coordinate here for a smooth delivery!`,
        type: 'system',
        imageUrl: null,
        location: null,
        mentions: [],
      });
      messages = [welcome.toObject()];
    }

    let myRole: 'customer' | 'rider' | 'manager' = 'customer';
    if (user.role === 'rider') myRole = 'rider';
    else if (user.role === 'main_manager' || user.role === 'branch_manager')
      myRole = 'manager';

    return {
      order: {
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        customerName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        deliveryLocation: order.deliveryLocation,
        isClosed,
        closedReason: isClosed ? order.status : null,
      },
      participants: {
        customer: {
          id: order.customerId ? String(order.customerId) : null,
          name: customerUser?.name || order.customerName || 'Customer',
          role: 'customer',
        },
        rider: order.riderId
          ? {
              id: String(order.riderId),
              name: riderUser?.name || 'Assigned Rider',
              role: 'rider',
            }
          : null,
        manager: {
          id: restaurant ? String(restaurant._id) : null,
          name: restaurant
            ? `${restaurant.name} (${restaurant.branch || 'Kitchen'})`
            : 'Restaurant Manager',
          role: 'manager',
        },
      },
      myRole,
      isClosed,
      closedReason: isClosed ? order.status : null,
      messages: messages.map((m) => this.mapMessage(m)),
    };
  }

  async sendMessage(
    orderId: string,
    dto: SendChatMessageDto,
    user: ScopeUser,
  ) {
    const order = await this.orderModel.findById(orderId).lean();
    if (!order) throw new NotFoundException('Order not found');

    await this.accessScope.assertOrderAccess(user, order);

    if (CLOSED_STATUSES.includes(order.status)) {
      throw new ForbiddenException(
        `This chat room has ended because the order was ${order.status}. No new messages can be sent.`,
      );
    }

    const hasText = Boolean(dto.text && dto.text.trim().length > 0);
    const hasImage = Boolean(dto.imageUrl);
    const hasLocation = Boolean(
      dto.location &&
        typeof dto.location.lat === 'number' &&
        typeof dto.location.lng === 'number',
    );

    if (!hasText && !hasImage && !hasLocation) {
      throw new BadRequestException('Message cannot be empty');
    }

    const userRecord = await this.userModel.findById(user.userId).lean();
    let senderRole: ChatSenderRole = 'customer';
    if (user.role === 'rider') senderRole = 'rider';
    else if (user.role === 'main_manager' || user.role === 'branch_manager')
      senderRole = 'manager';

    const senderName = userRecord?.name || user.userId;

    let messageType = dto.type || 'text';
    if (hasImage) messageType = 'image';
    else if (hasLocation) messageType = 'location';

    const created = await this.chatMessageModel.create({
      orderId: order._id,
      senderId: new Types.ObjectId(user.userId),
      senderName,
      senderRole,
      text: dto.text?.trim() || '',
      type: messageType,
      imageUrl: dto.imageUrl || null,
      location: hasLocation ? dto.location : null,
      mentions: dto.mentions || [],
    });

    return this.mapMessage(created.toObject());
  }

  async uploadImage(
    orderId: string,
    dto: UploadChatImageDto,
    user: ScopeUser,
  ) {
    const order = await this.orderModel.findById(orderId).lean();
    if (!order) throw new NotFoundException('Order not found');

    await this.accessScope.assertOrderAccess(user, order);

    if (CLOSED_STATUSES.includes(order.status)) {
      throw new ForbiddenException(
        `This chat room has ended because the order was ${order.status}. Uploading new media is disabled.`,
      );
    }

    if (!dto.dataUrl || !dto.dataUrl.includes('base64,')) {
      throw new BadRequestException('Invalid image data URL format');
    }

    const matches = dto.dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Invalid base64 string');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';

    const filename = `chat_${orderId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(this.uploadsDir, filename);

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 15 * 1024 * 1024) {
      throw new BadRequestException('Image size exceeds 15MB limit');
    }

    await fs.promises.writeFile(filePath, buffer);

    return {
      imageUrl: `/uploads/chat/${filename}`,
    };
  }

  async addSystemMessage(orderId: string, text: string) {
    try {
      const order = await this.orderModel.findById(orderId).lean();
      if (!order) return;

      await this.chatMessageModel.create({
        orderId: order._id,
        senderId: null,
        senderName: 'BiteRush System',
        senderRole: 'system',
        text,
        type: 'system',
        imageUrl: null,
        location: null,
        mentions: [],
      });
    } catch {
      // Ignore system log error
    }
  }

  private mapMessage(m: any) {
    return {
      id: String(m._id),
      orderId: String(m.orderId),
      senderId: m.senderId ? String(m.senderId) : null,
      senderName: m.senderName,
      senderRole: m.senderRole,
      text: m.text || '',
      type: m.type || 'text',
      imageUrl: m.imageUrl || null,
      location: m.location || null,
      mentions: m.mentions || [],
      createdAt: m.createdAt,
    };
  }
}
