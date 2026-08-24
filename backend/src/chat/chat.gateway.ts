import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendChatMessageDto } from './dto/chat.dto';
import { ScopeUser } from '../access/access-scope.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.user = {
          userId: payload.sub,
          role: payload.role,
        } as ScopeUser;
      }
    } catch {
      // Unauthenticated socket connection (will be authenticated on join if token provided)
    }
  }

  handleDisconnect(client: Socket) {
    // Socket disconnected
  }

  @SubscribeMessage('join_order_chat')
  async handleJoinOrderChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; token?: string },
  ) {
    try {
      let user: ScopeUser = client.data.user;
      if (!user && data.token) {
        const payload = this.jwtService.verify(data.token);
        user = {
          userId: payload.sub,
          role: payload.role,
        };
        client.data.user = user;
      }

      if (!user) {
        client.emit('chat_error', { message: 'Authentication required' });
        return;
      }

      const roomName = `order_${data.orderId}`;
      await client.join(roomName);

      client.emit('joined_order_chat', { orderId: data.orderId, room: roomName });
    } catch (err: any) {
      client.emit('chat_error', { message: err.message || 'Failed to join chat' });
    }
  }

  @SubscribeMessage('leave_order_chat')
  async handleLeaveOrderChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const roomName = `order_${data.orderId}`;
    await client.leave(roomName);
  }

  @SubscribeMessage('send_order_message')
  async handleSendOrderMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; message: SendChatMessageDto; token?: string },
  ) {
    try {
      let user: ScopeUser = client.data.user;
      if (!user && data.token) {
        const payload = this.jwtService.verify(data.token);
        user = {
          userId: payload.sub,
          role: payload.role,
        };
        client.data.user = user;
      }

      if (!user) {
        client.emit('chat_error', { message: 'Authentication required' });
        return { success: false, error: 'Authentication required' };
      }

      const created = await this.chatService.sendMessage(
        data.orderId,
        data.message,
        user,
      );

      return { success: true, message: created };
    } catch (err: any) {
      client.emit('chat_error', { message: err.message || 'Failed to send message' });
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('order_typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; isTyping: boolean; senderName: string; senderRole: string },
  ) {
    const roomName = `order_${data.orderId}`;
    client.to(roomName).emit('user_order_typing', {
      orderId: data.orderId,
      isTyping: data.isTyping,
      senderName: data.senderName,
      senderRole: data.senderRole,
    });
  }

  broadcastMessageToOrder(orderId: string, message: any) {
    if (this.server) {
      this.server.to(`order_${orderId}`).emit('new_order_message', {
        orderId,
        message,
      });
    }
  }
}
