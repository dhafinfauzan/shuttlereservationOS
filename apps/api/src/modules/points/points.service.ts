import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';

export class PointsService {
  static async list(params: { city?: string; type?: string; search?: string }) {
    const where: any = {};
    if (params.city) where.city = { contains: params.city };
    if (params.type && params.type !== 'all') {
      where.OR = [{ type: params.type }, { type: 'both' }];
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { address: { contains: params.search } },
        { city: { contains: params.search } },
      ];
    }

    return prisma.point.findMany({
      where,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });
  }

  static async getById(id: string) {
    const point = await prisma.point.findUnique({
      where: { id },
      include: {
        routePoints: {
          include: { route: true },
        },
      },
    });
    if (!point) {
      throw new NotFoundError(`Point with ID '${id}' not found`);
    }
    return point;
  }

  static async create(data: any) {
    return prisma.point.create({ data });
  }

  static async update(id: string, data: any) {
    await this.getById(id);
    return prisma.point.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.point.delete({
      where: { id },
    });
  }
}
