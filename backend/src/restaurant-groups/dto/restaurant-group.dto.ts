import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class LocationPointDto {
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  lat: number;

  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  lng: number;
}

export class CreateRestaurantGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  @MinLength(2, { message: 'Brand name must be at least 2 characters' })
  @MaxLength(60, { message: 'Brand name cannot exceed 60 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Cuisine cannot exceed 50 characters' })
  cuisine?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'Branch name is required' })
  @MinLength(2, { message: 'Branch name must be at least 2 characters' })
  @MaxLength(50, { message: 'Branch name cannot exceed 50 characters' })
  branch: string;

  @IsString()
  @IsNotEmpty({ message: 'Branch address is required' })
  @MinLength(3, { message: 'Address must be at least 3 characters' })
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'ETA cannot exceed 30 characters' })
  eta?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Delivery fee must be a number' })
  @Min(0, { message: 'Delivery fee cannot be negative' })
  @Max(10000, { message: 'Delivery fee cannot exceed Rs. 10,000' })
  deliveryFee?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Minimum order must be a number' })
  @Min(0, { message: 'Minimum order cannot be negative' })
  @Max(100000, { message: 'Minimum order cannot exceed Rs. 100,000' })
  minOrder?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  location?: LocationPointDto;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Branch name must be at least 2 characters' })
  @MaxLength(50, { message: 'Branch name cannot exceed 50 characters' })
  branch?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Address must be at least 3 characters' })
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'ETA cannot exceed 30 characters' })
  eta?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Delivery fee must be a number' })
  @Min(0, { message: 'Delivery fee cannot be negative' })
  @Max(10000, { message: 'Delivery fee cannot exceed Rs. 10,000' })
  deliveryFee?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Minimum order must be a number' })
  @Min(0, { message: 'Minimum order cannot be negative' })
  @Max(100000, { message: 'Minimum order cannot exceed Rs. 100,000' })
  minOrder?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  location?: LocationPointDto;
}

export class InviteStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'Staff name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
