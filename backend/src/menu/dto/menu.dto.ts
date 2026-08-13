import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class ToggleAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;
}

export class CreateMenuItemDto {
  @IsString()
  restaurantId: string;

  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  images?: string[];

  @IsOptional()
  variants?: Array<{ name: string; priceDelta: number }>;

  @IsOptional()
  extras?: Array<{ name: string; price: number }>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  discountPercent?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  images?: string[];

  @IsOptional()
  variants?: Array<{ name: string; priceDelta: number }>;

  @IsOptional()
  extras?: Array<{ name: string; price: number }>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  discountPercent?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
