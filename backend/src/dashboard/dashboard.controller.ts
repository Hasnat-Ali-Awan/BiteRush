import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('restaurant')
  getRestaurantDashboard(@Query('restaurantId') restaurantId?: string) {
    return this.dashboardService.getRestaurantDashboard(restaurantId);
  }
}
