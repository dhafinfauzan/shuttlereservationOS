import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';

export class VehiclesService {
  static async list(params: { status?: string; search?: string }) {
    const where: any = {};
    if (params.status && params.status !== 'all') where.status = params.status;
    if (params.search) {
      where.OR = [
        { plateNumber: { contains: params.search } },
        { model: { contains: params.search } },
      ];
    }

    return prisma.vehicle.findMany({
      where,
      orderBy: { plateNumber: 'asc' },
    });
  }

  static async getById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          take: 5,
          orderBy: { departureDate: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID '${id}' not found`);
    }

    return vehicle;
  }

  static async create(data: any) {
    return prisma.vehicle.create({ data });
  }

  static async update(id: string, data: any) {
    await this.getById(id);
    return prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.vehicle.delete({
      where: { id },
    });
  }
}
