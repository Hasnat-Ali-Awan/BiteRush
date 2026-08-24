import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ORDER_STATUSES } from '../schemas/order.schema';
import type { OrderStatus } from '../schemas/order.schema';

class CreateOrderItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

class LocationPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateOrderDto {
  @IsString()
  restaurantId: string;

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  deliveryLocation?: LocationPointDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status: OrderStatus;
}

export class AssignRiderDto {
  @IsString()
  riderId: string;
}

export class UpdateRiderLocationDto {
  @ValidateNested()
  @Type(() => LocationPointDto)
  location: LocationPointDto;
}
