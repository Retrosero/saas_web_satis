import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(tenantId: string) {
    const [
      totalCustomers,
      totalProducts,
      totalSales,
      totalOrders,
      totalCollections,
    ] = await Promise.all([
      this.prisma.client.customer.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.client.product.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.client.sale.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.client.order.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.client.collection.count({ where: { tenantId, isDeleted: false } }),
    ]);

    return {
      totalCustomers,
      totalProducts,
      totalSales,
      totalCollections,
      totalOrders,
    };
  }
}
