import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CHAT_MESSAGE_TYPES } from '../schemas/chat-message.schema';
import type { ChatMessageType } from '../schemas/chat-message.schema';

export class ChatLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class SendChatMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsIn(CHAT_MESSAGE_TYPES)
  type?: ChatMessageType;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChatLocationDto)
  location?: ChatLocationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];
}

export class UploadChatImageDto {
  @IsString()
  dataUrl: string;
}
