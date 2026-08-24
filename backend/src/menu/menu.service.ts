import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schemas/menu-item.schema';
import {
  CreateMenuItemDto,
  ToggleAvailabilityDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { MemoryCacheService } from '../common/cache/memory-cache.service';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(MenuItem.name)
    private readonly menuModel: Model<MenuItemDocument>,
    private readonly cache: MemoryCacheService,
  ) {}

  async create(dto: CreateMenuItemDto) {
    this.cache.delByPrefix('menu:');
    const created = await this.menuModel.create({
      ...dto,
      restaurantId: new Types.ObjectId(dto.restaurantId),
      categoryId: new Types.ObjectId(dto.categoryId),
      images: dto.images ?? [],
      variants: dto.variants ?? [],
      extras: dto.extras ?? [],
      discountPercent: dto.discountPercent ?? 0,
      isAvailable: dto.isAvailable ?? true,
    });

    const item = await this.menuModel
      .findById(created._id)
      .populate('categoryId', 'name')
      .lean();
    return this.mapItem(item);
  }

  async findAll(filters: {
    restaurantId?: string;
    categoryId?: string;
    available?: string;
    search?: string;
  }) {
    const cacheKey = `menu:${filters.restaurantId ?? ''}:${filters.categoryId ?? ''}:${filters.available ?? ''}:${filters.search ?? ''}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const query: Record<string, unknown> = {};
    if (filters.restaurantId) {
      query.restaurantId = new Types.ObjectId(filters.restaurantId);
    }
    if (filters.categoryId) {
      query.categoryId = new Types.ObjectId(filters.categoryId);
    }
    if (filters.available === 'true') query.isAvailable = true;
    if (filters.available === 'false') query.isAvailable = false;
    if (filters.search?.trim()) {
      query.name = { $regex: filters.search.trim(), $options: 'i' };
    }

    const items = await this.menuModel
      .find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const result = items.map((item) => this.mapItem(item));
    this.cache.set(cacheKey, result, 5);
    return result;
  }

  async findOne(id: string) {
    const item = await this.menuModel
      .findById(id)
      .populate('categoryId', 'name')
      .lean();
    if (!item) throw new NotFoundException('Menu item not found');
    return this.mapItem(item);
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    this.cache.delByPrefix('menu:');
    const payload: Record<string, unknown> = { ...dto };
    if (dto.categoryId) {
      payload.categoryId = new Types.ObjectId(dto.categoryId);
    }

    const item = await this.menuModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
      .populate('categoryId', 'name')
      .lean();
    if (!item) throw new NotFoundException('Menu item not found');
    return this.mapItem(item);
  }

  async toggleAvailability(id: string, dto: ToggleAvailabilityDto) {
    this.cache.delByPrefix('menu:');
    const item = await this.menuModel
      .findByIdAndUpdate(
        id,
        { isAvailable: dto.isAvailable },
        { returnDocument: 'after' },
      )
      .populate('categoryId', 'name')
      .lean();
    if (!item) throw new NotFoundException('Menu item not found');
    return this.mapItem(item);
  }

  async remove(id: string) {
    this.cache.delByPrefix('menu:');
    const item = await this.menuModel.findByIdAndDelete(id).lean();
    if (!item) throw new NotFoundException('Menu item not found');
    return { deleted: true, id };
  }

  private mapItem(item: any) {
    const category = item.categoryId as
      { _id: Types.ObjectId; name: string } | Types.ObjectId | undefined;

    const categoryId =
      category && typeof category === 'object' && 'name' in category
        ? String(category._id)
        : String(item.categoryId);
    const categoryName =
      category && typeof category === 'object' && 'name' in category
        ? category.name
        : undefined;

    return {
      id: String(item._id),
      restaurantId: String(item.restaurantId),
      categoryId,
      categoryName,
      name: item.name as string,
      description: item.description as string,
      basePrice: item.basePrice as number,
      images: (item.images as string[]) ?? [],
      variants: item.variants ?? [],
      extras: item.extras ?? [],
      discountPercent: (item.discountPercent as number) ?? 0,
      isAvailable: Boolean(item.isAvailable),
      orderCount: (item.orderCount as number) ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
