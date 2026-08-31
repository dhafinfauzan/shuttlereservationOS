import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { ActivityService } from '../activity/activity.service.js';
import { CHECKIN_STATUS, ACTIVITY_TYPE } from '../../config/constants.js';

export class ManifestService {
  static async listByTrip(tripId: string) {
    return prisma.manifest.findMany({
      where: { tripId },
      include: {
        booking: true,
        checkedInByUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { seatNumber: 'asc' },
    });
  }

  static async updateStatus(id: string, status: string, notes?: string, userId?: string) {
    const manifest = await prisma.manifest.findUnique({
      where: { id },
      include: { trip: true },
    });

    if (!manifest) {
      throw new NotFoundError(`Manifest record '${id}' not found`);
    }

    const updated = await prisma.manifest.update({
      where: { id },
      data: {
        checkInStatus: status,
        checkedInAt: status === CHECKIN_STATUS.CHECKED_IN ? new Date() : null,
        checkedInByUserId: userId,
        notes: notes !== undefined ? notes : manifest.notes,
      },
      include: {
        booking: true,
        checkedInByUser: { select: { id: true, name: true, role: true } },
      },
    });

    if (status === CHECKIN_STATUS.CHECKED_IN) {
      await ActivityService.log({
        type: ACTIVITY_TYPE.CHECKIN,
        title: 'Check-in penumpang',
        description: `${manifest.passengerName} · Kursi ${manifest.seatNumber}`,
        metadata: { manifestId: id, tripId: manifest.tripId },
        userId,
      });
    }

    return updated;
  }
}
