import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurants/schemas/restaurant.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import {
  Reservation,
  ReservationDocument,
} from '../reservations/schemas/reservation.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { MenuItem, MenuItemDocument } from '../menu/schemas/menu-item.schema';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuModel: Model<MenuItemDocument>,
  ) {}

  async run() {
    await Promise.all([
      this.orderModel.deleteMany({}),
      this.reservationModel.deleteMany({}),
      this.menuModel.deleteMany({}),
      this.categoryModel.deleteMany({}),
      this.restaurantModel.deleteMany({}),
    ]);

    const restaurant = await this.restaurantModel.create({
      name: 'Lahore BBQ House',
      branch: 'Downtown Branch',
      avgRating: 4.6,
    });

    const categories = await this.categoryModel.insertMany([
      { name: 'BBQ' },
      { name: 'Karahi' },
      { name: 'Bread' },
      { name: 'Sides' },
      { name: 'Drinks' },
    ]);

    const byName = Object.fromEntries(
      categories.map((category) => [category.name, category._id]),
    );

    const menuItems = [
      {
        name: 'Chicken Malai Boti',
        category: 'BBQ',
        basePrice: 850,
        discountPercent: 0,
        isAvailable: true,
        description:
          'Creamy, succulent boneless chicken pieces marinated in yogurt, cream, and special house spices, then slow-grilled to perfection.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCNum03fAQOrtU1QrE5ABZ5i50Rmxrmt0trPIK6c5E74DUvHOAKi7dDLqCo0OAPm22IUPunHCLpRG2L8PHSg-TcV6NzeRLsjlRfhNTRtho79fieCJ3yKQBTXnQQYOrguuy6i8fLFvemBd-VnYSIDcTXs7wjL3soo3k1QkYEyjbBb6Y0vHAy-B1GeF9BM-SMDfFBpMfGHnamCCGwHvWT4wJsDogrt9gYrKeCjR8Z3ew2ix5opzvoIBNRCSFAl7DttBsbVjJxx9VWpvfj',
        variants: [
          { name: 'Half', priceDelta: 0 },
          { name: 'Full', priceDelta: 700 },
        ],
        extras: [
          { name: 'Extra raita', price: 80 },
          { name: 'Cheese naan', price: 220 },
        ],
      },
      {
        name: 'Mutton Karahi',
        category: 'Karahi',
        basePrice: 1450,
        discountPercent: 10,
        isAvailable: true,
        description:
          'Traditional mutton karahi cooked in a tomato-based gravy with ginger and green chillies.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCWfNEUwy8BnrUtr3jTT0EMbuzVSQ6VsQs44mxzXt-8wc14vcHQa4AZ8VDRcU8h7GKOB9YFKYIs0xgwpjV70pD1gpcZ--fg020d9owdYabpocJhRxMVJZugQ-LgRX2HZVzp0riQb-FP3bRrL1fqwAHI7t-d8yLvnwN6CWvTzqbID2Z379yvncgGcVKA8NEuq_zoxUqMA0dEJSL2nLsdFtfhIlZq6VLpcZeHG-F5JHR6Pi-JOFb6Fg-joOhAqg8xggq5B3g1XQMb4FPv',
        variants: [
          { name: 'Half', priceDelta: 0 },
          { name: 'Full', priceDelta: 900 },
        ],
        extras: [{ name: 'Extra gravy', price: 150 }],
      },
      {
        name: 'Beef Seekh Kabab',
        category: 'BBQ',
        basePrice: 750,
        discountPercent: 0,
        isAvailable: true,
        description: 'Charred beef seekh kebabs with mint chutney.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDROD1ouCvpDxtzjrmP1Y4fT2T4MwoLXcuSBNi7bVsHJAvjn1oErki0-Tz4YELkSeGogho8cPgnEiMJ9twppLen1ch1nFVlN6irQMtHblsU5tI95HR6PcXFEL6uR0ml_PUH_RSaKM0lDhwLeDUGsmzX0ASG74lenarPeKeG2GsH-TszDy1gyzmuo65r_pNNLEWtP7-JP26JGkQKvarmaIdqOOFXVx4cXo_Hx0__-uFLG3PYXMgFYRCPhvsB352KVlh214f46bYXlVU2',
        variants: [{ name: 'Regular', priceDelta: 0 }],
        extras: [],
      },
      {
        name: 'Garlic Naan',
        category: 'Bread',
        basePrice: 120,
        discountPercent: 0,
        isAvailable: true,
        description: 'Butter garlic naan baked fresh in the tandoor.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCdrstwpDVQUIcppd_f26e-GBvoNDjCobz4-2nrkhvXYxjrrsGcVTAYjDz7RDjyixFT8bdBh6b4XoN1VswFWM_E7S63QnyOlLIpQjoTLYXeoczgoDLvwsAS4oG5_rXMFdZjnPdyK21aql-rjL_zBOkAun9OSfiOQsXrwe84S8y4AY1UhRUuciGP426zselYiJCeap-_CzQFqBVbXERNQgSjqpLXeMfuxtdOgGi_Js-sCQEc7WJZtDZh_5NAhYKPasZhjXBys1AoCNFZ',
        variants: [],
        extras: [],
      },
      {
        name: 'Mutton White Karahi',
        category: 'Karahi',
        basePrice: 1600,
        discountPercent: 0,
        isAvailable: false,
        description: 'Creamy white karahi finished with yogurt and cream.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuChTHv5IzkgFn3ttGaRBQrbB5Jn5S8lB9YOeS0pZHrAgJRi4n5-0wVTYMmSmfh1skAOK5S49BJst_0aF8vTy9jX1sB6QXhfuueTr3YJ2blZD5Gt-wjCnBCWRTqcvQA7Ui7-P-iBzS56P_O9ftSO4mzaAxu_0kat5UbJOqgjt4Mg5dj52ZFtPQCcq8EWoi0wideyd9GvFdBwiuORN8mbcdForeJhw_FOVKZuuNM3CHs0L4UMOmSbA2yT2Ax-DMnF-hHHoAj1kGdrIGZ_',
        variants: [
          { name: 'Half', priceDelta: 0 },
          { name: 'Full', priceDelta: 1000 },
        ],
        extras: [],
      },
      {
        name: 'BBQ Platter',
        category: 'BBQ',
        basePrice: 2090,
        discountPercent: 5,
        isAvailable: true,
        description: 'Assorted grilled meats platter for sharing.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCgVYXA04RI-eoq8Zn2xain1QldlqScy7IgHTdbP6h4h8P3knLC2FU5Nh5BV6_qT7hJbwrq50OmBlC31odxVojJ3dr41wR4pgYIqqPYFyBp1DUVvhRKaBsBeku2Hz0OIPdeo8ATzFWEFJvhCU7AIOYb8Cc5Ujfn0ZEEHfTYohgghUKed6APIsU2XcqabQcIULCcZzPO8HFQrO-jWlNgIH8m3ryjTjPLQntcnWVJmeyNyWUTz_r83bEIc4E5cC9TBte1RofwjZ7gdcBy',
        variants: [{ name: 'Family', priceDelta: 0 }],
        extras: [{ name: 'Extra naan basket', price: 300 }],
      },
    ];

    await this.menuModel.insertMany(
      menuItems.map((item) => ({
        restaurantId: restaurant._id,
        categoryId: byName[item.category],
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        images: [item.image],
        variants: item.variants,
        extras: item.extras,
        discountPercent: item.discountPercent,
        isAvailable: item.isAvailable,
        orderCount: 0,
      })),
    );

    const orderDishes = menuItems.map((item) => ({
      name: item.name,
      price: item.basePrice,
    }));

    const customers = [
      'Ali Raza',
      'Sara Khan',
      'Hassan Ahmed',
      'Fatima Noor',
      'Bilal Sheikh',
      'Ayesha Malik',
    ];

    const now = Date.now();
    const orders = [];

    for (let day = 6; day >= 0; day--) {
      const count = day === 0 ? 8 : 4 + (day % 3);
      for (let i = 0; i < count; i++) {
        const item = orderDishes[(day + i) % orderDishes.length];
        const qty = 1 + (i % 3);
        const createdAt = new Date(
          now - day * 24 * 60 * 60 * 1000 - i * 45 * 60 * 1000,
        );
        const isTodayPending = day === 0 && i < 4;

        orders.push({
          restaurantId: restaurant._id,
          orderNumber: `BR-${String(7000 + day * 10 + i)}`,
          customerName: customers[(day + i) % customers.length],
          items: [{ name: item.name, quantity: qty, price: item.price }],
          total: item.price * qty,
          status: isTodayPending
            ? 'pending'
            : day === 0
              ? 'accepted'
              : 'delivered',
          createdAt,
          updatedAt: createdAt,
        });
      }
    }

    await this.orderModel.insertMany(orders);

    const reservedAt = new Date();
    reservedAt.setHours(20, 0, 0, 0);

    await this.reservationModel.insertMany([
      {
        restaurantId: restaurant._id,
        customerName: 'Usman Tariq',
        partySize: 4,
        reservedAt,
        status: 'pending',
      },
      {
        restaurantId: restaurant._id,
        customerName: 'Nadia Iqbal',
        partySize: 2,
        reservedAt: new Date(reservedAt.getTime() + 60 * 60 * 1000),
        status: 'pending',
      },
      {
        restaurantId: restaurant._id,
        customerName: 'Omar Farooq',
        partySize: 6,
        reservedAt: new Date(reservedAt.getTime() + 2 * 60 * 60 * 1000),
        status: 'pending',
      },
      {
        restaurantId: restaurant._id,
        customerName: 'Zainab Ali',
        partySize: 3,
        reservedAt: new Date(reservedAt.getTime() + 3 * 60 * 60 * 1000),
        status: 'pending',
      },
      {
        restaurantId: restaurant._id,
        customerName: 'Hamza Qureshi',
        partySize: 5,
        reservedAt: new Date(reservedAt.getTime() + 4 * 60 * 60 * 1000),
        status: 'pending',
      },
    ]);

    return {
      restaurantId: String(restaurant._id),
      orders: orders.length,
      reservations: 5,
      categories: categories.length,
      menuItems: menuItems.length,
      message: 'Seed complete — Dashboard + Menu Management ready',
    };
  }
}
