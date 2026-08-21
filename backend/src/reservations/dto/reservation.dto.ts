import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export const RESERVATION_STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'seated',
  'completed',
  'cancelled',
] as const;

export class CreateReservationDto {
  @IsString()
  restaurantId: string;

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  @Min(1)
  partySize: number;

  @IsString()
  reservedAt: string;

  @IsOptional()
  @IsString()
  tableLabel?: string;
}

export class UpdateReservationStatusDto {
  @IsIn(RESERVATION_STATUSES)
  status: (typeof RESERVATION_STATUSES)[number];

  @IsOptional()
  @IsString()
  tableLabel?: string;
}
