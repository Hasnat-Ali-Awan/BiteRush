import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RestaurantGroupsService } from './restaurant-groups.service';
import {
  CreateBranchDto,
  CreateRestaurantGroupDto,
  InviteStaffDto,
} from './dto/restaurant-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('main_manager')
export class RestaurantGroupsController {
  constructor(private readonly groupsService: RestaurantGroupsService) {}

  @Post()
  createGroup(@Body() dto: CreateRestaurantGroupDto, @CurrentUser() user: AuthUser) {
    return this.groupsService.createGroup(dto, user.userId);
  }

  @Get('mine')
  getMyGroup(@CurrentUser() user: AuthUser) {
    return this.groupsService.getMyGroup(user.userId);
  }

  @Get('mine/branches')
  listMyBranches(@CurrentUser() user: AuthUser) {
    return this.groupsService.listBranchesForOwner(user.userId);
  }

  @Post(':groupId/branches')
  createBranch(
    @Param('groupId') groupId: string,
    @Body() dto: CreateBranchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groupsService.createBranch(groupId, dto, user.userId);
  }

  @Post('branches/:branchId/invite-manager')
  inviteManager(
    @Param('branchId') branchId: string,
    @Body() dto: InviteStaffDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groupsService.inviteBranchManager(branchId, dto, user.userId);
  }

  @Post('branches/:branchId/invite-rider')
  inviteRider(
    @Param('branchId') branchId: string,
    @Body() dto: InviteStaffDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groupsService.inviteRider(branchId, dto, user.userId);
  }
}
