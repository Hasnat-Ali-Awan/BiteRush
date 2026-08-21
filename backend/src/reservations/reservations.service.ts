import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Reservation,
  ReservationDocument,
} from './schemas/reservation.schema';
import { UpdateReservationStatusDto, CreateReservationDto } from './dto/reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
  ) {}

  async create(dto: CreateReservationDto) {
    const row = await this.reservationModel.create({
      restaurantId: dto.restaurantId,
      customerName: dto.customerName,
      phone: dto.phone ?? '',
      partySize: dto.partySize,
      reservedAt: new Date(dto.reservedAt),
      tableLabel: dto.tableLabel ?? '',
      status: 'pending',
    });
    return this.map(row.toObject());
  }

  async findAll(restaurantIds?: string | string[], status?: string) {
    const filter: Record<string, unknown> = {};
    if (Array.isArray(restaurantIds)) {
      if (restaurantIds.length) filter.restaurantId = { $in: restaurantIds };
    } else if (restaurantIds) {
      filter.restaurantId = restaurantIds;
    }
    if (status) filter.status = status;
    const rows = await this.reservationModel
      .find(filter)
      .sort({ reservedAt: 1 })
      .lean();
    return rows.map((row) => this.map(row));
  }

  async updateStatus(id: string, dto: UpdateReservationStatusDto) {
    const payload: Record<string, unknown> = { status: dto.status };
    if (dto.tableLabel) payload.tableLabel = dto.tableLabel;

    const row = await this.reservationModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
      .lean();
    if (!row) throw new NotFoundException('Reservation not found');
    return this.map(row);
  }

  private map(row: any) {
    return {
      id: String(row._id),
      restaurantId: String(row.restaurantId),
      customerName: row.customerName,
      phone: row.phone || '',
      partySize: row.partySize,
      reservedAt: row.reservedAt,
      tableLabel: row.tableLabel || '',
      status: row.status,
    };
  }
}
