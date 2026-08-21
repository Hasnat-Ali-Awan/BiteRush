import {
  Body,
  Controller,
  ForbiddenException,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import {
  CreateMenuItemDto,
  ToggleAvailabilityDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AccessScopeService } from '../access/access-scope.service';
import { MANAGER_ROLES } from '../users/schemas/user.schema';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  async create(
    @Body() dto: CreateMenuItemDto,
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
  ) {
    dto.restaurantId = await this.requireRestaurant(user, branchId);
    return this.menuService.create(dto);
  }

  @Get()
  findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('available') available?: string,
    @Query('search') search?: string,
  ) {
    return this.menuService.findAll({
      restaurantId,
      categoryId,
      available,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.update(id, dto);
  }

  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  toggleAvailability(
    @Param('id') id: string,
    @Body() dto: ToggleAvailabilityDto,
  ) {
    return this.menuService.toggleAvailability(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
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
