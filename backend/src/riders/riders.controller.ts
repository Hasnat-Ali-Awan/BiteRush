import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import {
  UpdateOrderStatusDto,
  UpdateRiderLocationDto,
} from '../orders/dto/order.dto';
import type { OrderStatus } from '../orders/schemas/order.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AccessScopeService } from '../access/access-scope.service';

@Controller('rider')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('rider')
export class RidersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get('deliveries')
  async myDeliveries(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findForRider(
      user.userId,
      status as OrderStatus | undefined,
    );
  }

  @Get('available')
  async available(@CurrentUser() user: AuthUser) {
    const restaurantId = await this.accessScope.getPrimaryRestaurantId(user);
    if (!restaurantId) return [];
    return this.ordersService.findAvailableForRider(restaurantId);
  }

  @Post('deliveries/:orderId/accept')
  async accept(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const restaurantId = await this.accessScope.getPrimaryRestaurantId(user);
    const order = await this.ordersService.acceptDelivery(orderId, user.userId);
    if (restaurantId && order.restaurantId !== restaurantId) {
      await this.accessScope.assertRestaurantAccess(user, order.restaurantId);
    }
    return order;
  }

  @Patch('deliveries/:orderId/status')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const order = await this.ordersService.findOne(orderId);
    await this.accessScope.assertOrderAccess(user, order);
    return this.ordersService.updateStatus(orderId, dto.status);
  }

  @Patch('deliveries/:orderId/location')
  async updateLocation(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateRiderLocationDto,
    @CurrentUser() user: AuthUser,
  ) {
    const order = await this.ordersService.findOne(orderId);
    await this.accessScope.assertOrderAccess(user, order);
    return this.ordersService.updateRiderLocation(
      orderId,
      user.userId,
      dto.location,
    );
  }
}
