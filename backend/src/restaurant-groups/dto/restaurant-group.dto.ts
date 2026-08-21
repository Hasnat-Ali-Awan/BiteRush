import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class LocationPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateRestaurantGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBranchDto {
  @IsString()
  branch: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  eta?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  deliveryFee?: number;

  @IsOptional()
  minOrder?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  location?: LocationPointDto;
}

export class InviteStaffDto {
  @IsString()
  name: string;

  @IsString()
  email: string;
}
