import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';

export class RoutesService {
  static async list(params: { search?: string; isActive?: boolean }) {
    const where: any = {};
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { originCity: { contains: params.search } },
        { destinationCity: { contains: params.search } },
      ];
    }

    return prisma.route.findMany({
      where,
      include: {
        points: {
          include: { point: true },
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: { trips: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        points: {
          include: { point: true },
          orderBy: { sequence: 'asc' },
        },
        trips: {
          take: 10,
          orderBy: { departureTime: 'asc' },
          include: { vehicle: true, driver: true },
        },
      },
    });

    if (!route) {
      throw new NotFoundError(`Route with ID '${id}' not found`);
    }

    return route;
  }

  static async create(data: any) {
    const { pointIds, ...routeData } = data;

    return prisma.$transaction(async (tx) => {
      const route = await tx.route.create({
        data: routeData,
      });

      if (pointIds && pointIds.length > 0) {
        await tx.routePoint.createMany({
          data: pointIds.map((p: any) => ({
            routeId: route.id,
            pointId: p.pointId,
            sequence: p.sequence,
            type: p.type,
            stopMinutes: p.stopMinutes || 0,
          })),
        });
      }

      return tx.route.findUnique({
        where: { id: route.id },
        include: {
          points: {
            include: { point: true },
            orderBy: { sequence: 'asc' },
          },
        },
      });
    });
  }

  static async update(id: string, data: any) {
    await this.getById(id);
    const { pointIds, ...routeData } = data;

    return prisma.$transaction(async (tx) => {
      await tx.route.update({
        where: { id },
        data: routeData,
      });

      if (pointIds) {
        await tx.routePoint.deleteMany({ where: { routeId: id } });
        if (pointIds.length > 0) {
          await tx.routePoint.createMany({
            data: pointIds.map((p: any) => ({
              routeId: id,
              pointId: p.pointId,
              sequence: p.sequence,
              type: p.type,
              stopMinutes: p.stopMinutes || 0,
            })),
          });
        }
      }

      return tx.route.findUnique({
        where: { id },
        include: {
          points: {
            include: { point: true },
            orderBy: { sequence: 'asc' },
          },
        },
      });
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.route.delete({
      where: { id },
    });
  }
}
