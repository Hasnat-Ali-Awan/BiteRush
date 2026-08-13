import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async create(dto: CreateOrderDto) {
    const total = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const orderNumber = `BR-${Date.now().toString().slice(-8)}`;

    return this.orderModel.create({
      restaurantId: dto.restaurantId,
      orderNumber,
      customerName: dto.customerName,
      items: dto.items,
      total,
      status: 'pending',
    });
  }

  async findAll(restaurantId?: string, status?: OrderStatus) {
    const filter: Record<string, unknown> = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    if (status) filter.status = status;
    return this.orderModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id).lean();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
