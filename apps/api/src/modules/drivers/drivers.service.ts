import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { getInitials } from '../../lib/code-generator.js';

export class DriversService {
  static async list(params: { status?: string; search?: string }) {
    const where: any = {};
    if (params.status && params.status !== 'all') where.status = params.status;
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search } },
        { phone: { contains: params.search } },
        { licenseNumber: { contains: params.search } },
      ];
    }

    return prisma.driver.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  static async getById(id: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        trips: {
          take: 5,
          orderBy: { departureDate: 'desc' },
        },
      },
    });

    if (!driver) {
      throw new NotFoundError(`Driver with ID '${id}' not found`);
    }

    return driver;
  }

  static async create(data: any) {
    if (!data.avatarInitials && data.fullName) {
      data.avatarInitials = getInitials(data.fullName);
    }
    return prisma.driver.create({ data });
  }

  static async update(id: string, data: any) {
    await this.getById(id);
    if (data.fullName && !data.avatarInitials) {
      data.avatarInitials = getInitials(data.fullName);
    }
    return prisma.driver.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.driver.delete({
      where: { id },
    });
  }
}
