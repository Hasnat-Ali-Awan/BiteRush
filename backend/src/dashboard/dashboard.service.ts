import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import {
  Reservation,
  ReservationDocument,
} from '../reservations/schemas/reservation.schema';
import {
  RestaurantGroup,
  RestaurantGroupDocument,
} from '../restaurant-groups/schemas/restaurant-group.schema';
import { AccessScopeService } from '../access/access-scope.service';
import { MemoryCacheService } from '../common/cache/memory-cache.service';
import type { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(RestaurantGroup.name)
    private readonly groupModel: Model<RestaurantGroupDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
    private readonly accessScope: AccessScopeService,
    private readonly cache: MemoryCacheService,
  ) {}

  async getRestaurantDashboard(
    userId: string,
    role: UserRole,
    branchId?: string,
  ) {
    const cacheKey = `dashboard:${userId}:${role}:${branchId || 'all'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const restaurantIds = await this.accessScope.getAccessibleRestaurantIds({
      userId,
      role,
    });

    if (!restaurantIds.length) {
      return this.emptyDashboard(role);
    }

    const scopedIds = branchId
      ? [
          await this.accessScope.assertRestaurantAccess(
            { userId, role },
            branchId,
          ),
        ]
      : restaurantIds;

    const branches = await this.restaurantModel
      .find(this.accessScope.buildRestaurantFilter(restaurantIds))
      .lean();

    const group =
      role === 'main_manager'
        ? await this.groupModel.findOne({ ownerId: userId }).lean()
        : null;

    const primaryBranch =
      branches.find((b) => String(b._id) === scopedIds[0]) || branches[0];

    const scopedObjectIds = scopedIds.map((id) => new Types.ObjectId(id));
    const restaurantFilter = { restaurantId: { $in: scopedObjectIds } };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const paidStatuses: OrderStatus[] = [
      'accepted',
      'preparing',
      'ready',
      'assigned',
      'picked_up',
      'on_the_way',
      'delivered',
    ];

    const [
      todaysOrders,
      yesterdaysOrders,
      todayRevenueAgg,
      yesterdayRevenueAgg,
      pendingReservations,
      latestReservation,
      incomingOrders,
      weekOrders,
    ] = await Promise.all([
      this.orderModel.countDocuments({
        ...restaurantFilter,
        createdAt: { $gte: startOfToday },
        status: { $nin: ['rejected', 'cancelled'] },
      }),
      this.orderModel.countDocuments({
        ...restaurantFilter,
        createdAt: { $gte: startOfYesterday, $lt: startOfToday },
        status: { $nin: ['rejected', 'cancelled'] },
      }),
      this.orderModel.aggregate([
        {
          $match: {
            restaurantId: { $in: scopedObjectIds },
            createdAt: { $gte: startOfToday },
            status: { $in: paidStatuses },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            restaurantId: { $in: scopedObjectIds },
            createdAt: { $gte: startOfYesterday, $lt: startOfToday },
            status: { $in: paidStatuses },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.reservationModel.countDocuments({
        ...restaurantFilter,
        status: 'pending',
      }),
      this.reservationModel
        .findOne({ ...restaurantFilter, status: 'pending' })
        .sort({ createdAt: -1 })
        .select('partySize reservedAt')
        .lean(),
      this.orderModel
        .find({ ...restaurantFilter, status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber customerName items total status createdAt')
        .lean(),
      this.orderModel
        .find({
          restaurantId: { $in: scopedObjectIds },
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          status: { $in: paidStatuses },
        })
        .select('total createdAt items')
        .lean(),
    ]);

    const revenue = todayRevenueAgg[0]?.total ?? 0;
    const yesterdayRevenue = yesterdayRevenueAgg[0]?.total ?? 0;

    const result = {
      scope: role === 'main_manager' && !branchId ? 'all_branches' : 'branch',
      group: group
        ? {
            id: String(group._id),
            name: group.name,
          }
        : null,
      branches: branches.map((branch) => ({
        id: String(branch._id),
        name: branch.name,
        branch: branch.branch,
        address: branch.address,
        branchManagerId: branch.branchManagerId
          ? String(branch.branchManagerId)
          : null,
      })),
      restaurant: primaryBranch
        ? {
            id: String(primaryBranch._id),
            name: primaryBranch.name,
            branch: primaryBranch.branch,
            avgRating: primaryBranch.avgRating,
          }
        : null,
      stats: {
        todaysOrders,
        todaysOrdersChange: this.percentChange(todaysOrders, yesterdaysOrders),
        revenue,
        revenueChange: this.percentChange(revenue, yesterdayRevenue),
        pendingReservations,
        avgRating: primaryBranch?.avgRating ?? 0,
      },
      revenueByDay: this.buildRevenueByDay(weekOrders),
      popularDishes: this.buildPopularDishes(weekOrders),
      incomingOrders: incomingOrders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: (order as { createdAt?: Date }).createdAt,
      })),
      toast: latestReservation
        ? {
            message: `New reservation — Table for ${latestReservation.partySize}, ${this.formatTime(latestReservation.reservedAt)}`,
          }
        : null,
    };

    this.cache.set(cacheKey, result, 5);
    return result;
  }

  private emptyDashboard(role: UserRole) {
    return {
      scope: role === 'main_manager' ? 'all_branches' : 'branch',
      group: null,
      branches: [],
      restaurant: null,
      stats: {
        todaysOrders: 0,
        todaysOrdersChange: 0,
        revenue: 0,
        revenueChange: 0,
        pendingReservations: 0,
        avgRating: 0,
      },
      revenueByDay: [],
      popularDishes: [],
      incomingOrders: [],
      toast: null,
    };
  }

  private percentChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private localDateKey(date: Date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private buildRevenueByDay(
    orders: Array<{ total: number; createdAt?: Date }>,
  ) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      map.set(this.localDateKey(d), 0);
    }

    for (const order of orders) {
      const createdAt = order.createdAt;
      if (!createdAt) continue;
      const key = this.localDateKey(new Date(createdAt));
      if (map.has(key)) {
        map.set(key, (map.get(key) ?? 0) + order.total);
      }
    }

    return Array.from(map.entries()).map(([date, amount]) => ({
      date,
      label: days[new Date(`${date}T12:00:00`).getDay()],
      amount,
    }));
  }

  private buildPopularDishes(
    orders: Array<{ items: Array<{ name: string; quantity: number }> }>,
  ) {
    const counts = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items) {
        counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private formatTime(date: Date) {
    return new Date(date).toLocaleTimeString('en-PK', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
