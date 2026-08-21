import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'BiteRush API',
      version: 'v1',
      docs: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
        restaurants: 'GET /api/v1/restaurants',
        createRestaurant: 'POST /api/v1/restaurants',
        dashboard: 'GET /api/v1/dashboard/restaurant',
        orders: 'GET /api/v1/orders',
        updateStatus: 'PATCH /api/v1/orders/:id/status',
        categories: 'GET /api/v1/categories',
        menu: 'GET /api/v1/menu',
        createMenu: 'POST /api/v1/menu',
        updateMenu: 'PATCH /api/v1/menu/:id',
        toggleMenu: 'PATCH /api/v1/menu/:id/availability',
        deleteMenu: 'DELETE /api/v1/menu/:id',
      },
    };
  }
}
