import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MenuItem.name, schema: MenuItemSchema }]),
    AccessModule,
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService, MongooseModule],
})
export class MenuModule {}
