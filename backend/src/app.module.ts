import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CategoriesModule } from './categories/categories.module';
import { MenuModule } from './menu/menu.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantGroupsModule } from './restaurant-groups/restaurant-groups.module';
import { MailModule } from './mail/mail.module';
import { AccessModule } from './access/access.module';
import { RidersModule } from './riders/riders.module';

import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        maxPoolSize: 200,
        minPoolSize: 20,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        maxIdleTimeMS: 30000,
        family: 4,
      }),
    }),
    MailModule,
    AccessModule,
    OrdersModule,
    DashboardModule,
    CategoriesModule,
    MenuModule,
    RestaurantsModule,
    ReservationsModule,
    RestaurantGroupsModule,
    RidersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
