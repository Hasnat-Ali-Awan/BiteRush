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
import { OrdersService } from './orders.service';
import {
  AssignRiderDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import type { OrderStatus } from './schemas/order.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AccessScopeService } from '../access/access-scope.service';
import { MANAGER_ROLES } from '../users/schemas/user.schema';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    dto.customerName = dto.customerName || user.email;
    return this.ordersService.create(
      dto,
      user.role === 'customer' ? user.userId : undefined,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
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
    return this.ordersService.findAll(
      scoped,
      status as OrderStatus | undefined,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const order = await this.ordersService.findOne(id);
    await this.accessScope.assertOrderAccess(user, order);
    return order;
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES, 'rider')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const order = await this.ordersService.findOne(id);
    await this.accessScope.assertOrderAccess(user, order);
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Patch(':id/assign-rider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  async assignRider(
    @Param('id') id: string,
    @Body() dto: AssignRiderDto,
    @CurrentUser() user: AuthUser,
  ) {
    const order = await this.ordersService.findOne(id);
    await this.accessScope.assertRestaurantAccess(user, order.restaurantId);
    return this.ordersService.assignRider(id, dto.riderId);
  }
}
