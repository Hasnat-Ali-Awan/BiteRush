import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../menu/dto/menu.dto';
import { MemoryCacheService } from '../common/cache/memory-cache.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly cache: MemoryCacheService,
  ) {}

  async create(dto: CreateCategoryDto) {
    this.cache.del('categories:all');
    const category = await this.categoryModel.create(dto);
    return this.map(category.toObject());
  }

  async findAll() {
    const cached = this.cache.get<any[]>('categories:all');
    if (cached) return cached;

    const categories = await this.categoryModel.find().sort({ name: 1 }).lean();
    const result = categories.map((category) => this.map(category));
    this.cache.set('categories:all', result, 10);
    return result;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .lean();
    if (!category) throw new NotFoundException('Category not found');
    return this.map(category);
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id).lean();
    if (!category) throw new NotFoundException('Category not found');
    return { deleted: true, id };
  }

  private map(category: any) {
    return {
      id: String(category._id),
      name: category.name,
      imageUrl: category.imageUrl || '',
    };
  }
}
