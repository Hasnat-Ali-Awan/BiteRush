import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/order.dto';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  async create(dto: CreateOrderDto, customerId?: string) {
    const total = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const orderNumber = `BR-${Date.now().toString().slice(-8)}`;
    const restaurant = await this.restaurantModel.findById(dto.restaurantId).lean();
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const created = await this.orderModel.create({
      restaurantId: dto.restaurantId,
      orderNumber,
      customerName: dto.customerName,
      deliveryAddress: dto.deliveryAddress ?? '',
      deliveryLocation: dto.deliveryLocation ?? null,
      restaurantLocation: restaurant.location ?? null,
      riderCurrentLocation: null,
      riderLocationUpdatedAt: null,
      customerId: customerId ?? null,
      items: dto.items,
      total,
      status: 'pending',
    });

    return this.mapOrder(created.toObject());
  }

  async findAll(restaurantIds?: string[], status?: OrderStatus) {
    const filter: Record<string, unknown> = {};
    if (restaurantIds?.length) {
      filter.restaurantId = { $in: restaurantIds };
    }
    if (status) filter.status = status;
    const orders = await this.orderModel.find(filter).sort({ createdAt: -1 }).lean();
    return orders.map((order) => this.mapOrder(order));
  }

  async findForRider(riderId: string, status?: OrderStatus) {
    const filter: Record<string, unknown> = { riderId };
    if (status) filter.status = status;
    const orders = await this.orderModel.find(filter).sort({ createdAt: -1 }).lean();
    return orders.map((order) => this.mapOrder(order));
  }

  async findAvailableForRider(restaurantId: string) {
    const orders = await this.orderModel
      .find({ restaurantId, status: 'ready', riderId: null })
      .sort({ createdAt: -1 })
      .lean();
    return orders.map((order) => this.mapOrder(order));
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id).lean();
    if (!order) throw new NotFoundException('Order not found');
    const restaurant = await this.restaurantModel.findById(order.restaurantId).lean();
    return this.mapOrder(order, restaurant);
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    return this.mapOrder(order);
  }

  async assignRider(orderId: string, riderId: string) {
    const order = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { riderId, status: 'assigned', riderLocationUpdatedAt: null },
        { returnDocument: 'after' },
      )
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    return this.mapOrder(order);
  }

  async acceptDelivery(orderId: string, riderId: string) {
    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, status: 'ready', riderId: null },
        { riderId, status: 'assigned', riderLocationUpdatedAt: null },
        { returnDocument: 'after' },
      )
      .lean();
    if (!order) throw new NotFoundException('Delivery no longer available');
    return this.mapOrder(order);
  }

  async updateRiderLocation(
    orderId: string,
    riderId: string,
    location: { lat: number; lng: number },
  ) {
    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, riderId },
        {
          riderCurrentLocation: location,
          riderLocationUpdatedAt: new Date(),
        },
        { returnDocument: 'after' },
      )
      .lean();
    if (!order) throw new NotFoundException('Assigned delivery not found');
    return this.mapOrder(order);
  }

  private mapOrder(order: any, restaurant?: any) {
    return {
      ...order,
      id: String(order._id),
      restaurantId: String(order.restaurantId),
      customerId: order.customerId ? String(order.customerId) : null,
      riderId: order.riderId ? String(order.riderId) : null,
      restaurant: restaurant
        ? {
            id: String(restaurant._id),
            name: restaurant.name,
            branch: restaurant.branch,
            address: restaurant.address,
            location: restaurant.location ?? null,
          }
        : null,
    };
  }
}
