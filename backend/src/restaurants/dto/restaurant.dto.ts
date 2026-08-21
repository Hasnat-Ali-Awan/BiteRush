import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class LocationPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsString()
  branch: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsString()
  eta?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrder?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  location?: LocationPointDto;
}
