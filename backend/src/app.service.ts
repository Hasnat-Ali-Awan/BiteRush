import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'BiteRush API',
      version: 'v1',
      docs: {
        seed: 'POST /api/v1/seed',
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
