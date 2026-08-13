import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import {
  Reservation,
  ReservationDocument,
} from '../reservations/schemas/reservation.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
  ) {}

  async getRestaurantDashboard(restaurantId?: string) {
    const restaurant = restaurantId
      ? await this.restaurantModel.findById(restaurantId).lean()
      : await this.restaurantModel.findOne().lean();

    if (!restaurant) {
      throw new NotFoundException(
        'No restaurant found. Call POST /api/v1/seed first.',
      );
    }

    const id = restaurant._id;
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
        restaurantId: id,
        createdAt: { $gte: startOfToday },
        status: { $nin: ['rejected', 'cancelled'] },
      }),
      this.orderModel.countDocuments({
        restaurantId: id,
        createdAt: { $gte: startOfYesterday, $lt: startOfToday },
        status: { $nin: ['rejected', 'cancelled'] },
      }),
      this.orderModel.aggregate([
        {
          $match: {
            restaurantId: id,
            createdAt: { $gte: startOfToday },
            status: { $in: paidStatuses },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            restaurantId: id,
            createdAt: { $gte: startOfYesterday, $lt: startOfToday },
            status: { $in: paidStatuses },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.reservationModel.countDocuments({
        restaurantId: id,
        status: 'pending',
      }),
      this.reservationModel
        .findOne({ restaurantId: id, status: 'pending' })
        .sort({ createdAt: -1 })
        .lean(),
      this.orderModel
        .find({ restaurantId: id, status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.orderModel
        .find({
          restaurantId: id,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          status: { $in: paidStatuses },
        })
        .lean(),
    ]);

    const revenue = todayRevenueAgg[0]?.total ?? 0;
    const yesterdayRevenue = yesterdayRevenueAgg[0]?.total ?? 0;

    const revenueByDay = this.buildRevenueByDay(weekOrders);
    const popularDishes = this.buildPopularDishes(weekOrders);

    return {
      restaurant: {
        id: String(restaurant._id),
        name: restaurant.name,
        branch: restaurant.branch,
        avgRating: restaurant.avgRating,
      },
      stats: {
        todaysOrders,
        todaysOrdersChange: this.percentChange(todaysOrders, yesterdaysOrders),
        revenue,
        revenueChange: this.percentChange(revenue, yesterdayRevenue),
        pendingReservations,
        avgRating: restaurant.avgRating,
      },
      revenueByDay,
      popularDishes,
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
