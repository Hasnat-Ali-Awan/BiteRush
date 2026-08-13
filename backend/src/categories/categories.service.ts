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
    return this.categoryModel.create(dto);
  }

  findAll() {
    return this.categoryModel.find().sort({ name: 1 }).lean();
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .lean();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id).lean();
    if (!category) throw new NotFoundException('Category not found');
    return { deleted: true, id };
  }
}
