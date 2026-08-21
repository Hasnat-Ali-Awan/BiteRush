import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  UpdateReservationStatusDto,
} from './dto/reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AccessScopeService } from '../access/access-scope.service';
import { MANAGER_ROLES } from '../users/schemas/user.schema';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGER_ROLES)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
  ) {
    dto.restaurantId = await this.requireRestaurant(user, branchId);
    return this.reservationsService.create(dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    const ids = await this.accessScope.getAccessibleRestaurantIds(user);
    if (!ids.length) {
      throw new ForbiddenException('No branch assigned');
    }
    const scoped = branchId
      ? [await this.accessScope.assertRestaurantAccess(user, branchId)]
      : ids;
    return this.reservationsService.findAll(scoped, status);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }

  private async requireRestaurant(user: AuthUser, branchId?: string) {
    const ids = await this.accessScope.getAccessibleRestaurantIds(user);
    if (!ids.length) {
      throw new ForbiddenException('No branch assigned');
    }
    if (branchId) {
      return this.accessScope.assertRestaurantAccess(user, branchId);
    }
    return ids[0];
  }
}
