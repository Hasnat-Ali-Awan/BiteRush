import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { MANAGER_ROLES } from '../users/schemas/user.schema';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGER_ROLES)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('restaurant')
  getRestaurantDashboard(
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
  ) {
    return this.dashboardService.getRestaurantDashboard(
      user.userId,
      user.role,
      branchId,
    );
  }
}
