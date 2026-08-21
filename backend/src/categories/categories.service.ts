import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../menu/dto/menu.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  create(dto: CreateCategoryDto) {
    return this.categoryModel.create(dto).then((category) => this.map(category.toObject()));
  }

  async findAll() {
    const categories = await this.categoryModel.find().sort({ name: 1 }).lean();
    return categories.map((category) => this.map(category));
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
