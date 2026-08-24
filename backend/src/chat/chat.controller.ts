import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendChatMessageDto, UploadChatImageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('orders/:orderId/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getChat(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.getChat(orderId, user);
  }

  @Post()
  async sendMessage(
    @Param('orderId') orderId: string,
    @Body() dto: SendChatMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.sendMessage(orderId, dto, user);
  }

  @Post('upload')
  async uploadImage(
    @Param('orderId') orderId: string,
    @Body() dto: UploadChatImageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.uploadImage(orderId, dto, user);
  }
}
