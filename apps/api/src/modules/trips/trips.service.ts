import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../lib/errors.js';
import { SeatManager } from '../../lib/seat-manager.js';
import { ActivityService } from '../activity/activity.service.js';
import { SEAT_STATUS, TRIP_STATUS, CHECKIN_STATUS, ACTIVITY_TYPE } from '../../config/constants.js';

export class TripsService {
  static async list(params: {
    date?: string;
    routeId?: string;
    status?: string;
    search?: string;
  }) {
    await SeatManager.cleanupExpiredSeats();

    const where: any = {};
    if (params.date) where.departureDate = params.date;
    if (params.routeId) where.routeId = params.routeId;
    if (params.status && params.status !== 'all') where.status = params.status;
    if (params.search) {
      where.OR = [
        { tripCode: { contains: params.search } },
        { route: { name: { contains: params.search } } },
        { driver: { fullName: { contains: params.search } } },
        { vehicle: { plateNumber: { contains: params.search } } },
      ];
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: true,
        vehicle: true,
        driver: true,
        departurePoint: true,
        arrivalPoint: true,
        seats: true,
      },
      orderBy: [{ departureDate: 'asc' }, { departureTime: 'asc' }],
    });

    return trips.map((trip) => {
      const sold = trip.seats.filter((s) => s.status === SEAT_STATUS.BOOKED).length;
      const held = trip.seats.filter((s) => s.status === SEAT_STATUS.HELD).length;
      const available = trip.capacity - sold - held;

      let displayStatus = 'Terjadwal';
      if (trip.status === TRIP_STATUS.FULL || sold >= trip.capacity) {
        displayStatus = 'Penuh';
      } else if (trip.status === TRIP_STATUS.BOARDING) {
        displayStatus = 'Boarding';
      } else if (trip.status === TRIP_STATUS.DEPARTED) {
        displayStatus = 'Berangkat';
      } else if (trip.status === TRIP_STATUS.COMPLETED) {
        displayStatus = 'Selesai';
      } else if (trip.status === TRIP_STATUS.CANCELLED) {
        displayStatus = 'Batal';
      }

      return {
        id: trip.id,
        tripCode: trip.tripCode,
        time: trip.departureTime,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        date: trip.departureDate,
        timezone: trip.timezone,
        route: trip.route.name,
        routeId: trip.routeId,
        point: `${trip.departurePoint.name} · ${trip.arrivalPoint.name}`,
        departurePoint: trip.departurePoint,
        arrivalPoint: trip.arrivalPoint,
        driver: trip.driver.fullName,
        driverId: trip.driverId,
        vehicle: trip.vehicle.plateNumber,
        vehicleModel: trip.vehicle.model,
        vehicleId: trip.vehicleId,
        basePrice: trip.basePrice,
        price: trip.basePrice,
        capacity: trip.capacity,
        sold,
        held,
        available: Math.max(0, available),
        status: displayStatus,
        rawStatus: trip.status,
        label: trip.label,
        notes: trip.notes,
        createdAt: trip.createdAt,
      };
    });
  }

  static async getById(id: string) {
    await SeatManager.cleanupExpiredSeats();

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        departurePoint: true,
        arrivalPoint: true,
        seats: {
          orderBy: { seatNumber: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError(`Trip with ID '${id}' not found`);
    }

    const sold = trip.seats.filter((s) => s.status === SEAT_STATUS.BOOKED).length;
    const held = trip.seats.filter((s) => s.status === SEAT_STATUS.HELD).length;
    const available = Math.max(0, trip.capacity - sold - held);

    return {
      ...trip,
      sold,
      held,
      available,
    };
  }

  static async create(data: any, userId?: string) {
    const tripCode = data.tripCode || `KLN-${data.departureDate.replace(/-/g, '')}-${data.departureTime.replace(':', '')}-${data.routeId.slice(0, 4).toUpperCase()}`;

    return prisma.$transaction(
      async (tx) => {
        const existing = await tx.trip.findUnique({
          where: { tripCode },
        });
        if (existing) {
          throw new BadRequestError(`Trip code '${tripCode}' already exists`);
        }

        const trip = await tx.trip.create({
          data: {
            tripCode,
            routeId: data.routeId,
            vehicleId: data.vehicleId,
            driverId: data.driverId,
            departurePointId: data.departurePointId,
            arrivalPointId: data.arrivalPointId,
            departureDate: data.departureDate,
            departureTime: data.departureTime,
            arrivalTime: data.arrivalTime,
            timezone: data.timezone || 'WIB',
            basePrice: data.basePrice,
            capacity: data.capacity || 12,
            label: data.label,
            status: data.status || TRIP_STATUS.SCHEDULED,
            notes: data.notes,
          },
          include: {
            route: true,
            departurePoint: true,
            arrivalPoint: true,
            driver: true,
            vehicle: true,
          },
        });

        const seatRecords = Array.from({ length: trip.capacity }, (_, i) => ({
          tripId: trip.id,
          seatNumber: String(i + 1).padStart(2, '0'),
          status: SEAT_STATUS.AVAILABLE,
        }));

        await tx.tripSeat.createMany({
          data: seatRecords,
        });

        await ActivityService.log(
          {
            type: ACTIVITY_TYPE.TRIP_UPDATE,
            title: 'Jadwal baru ditambahkan',
            description: `${trip.route.name} · ${trip.departureTime} WIB (${trip.tripCode})`,
            metadata: { tripId: trip.id, tripCode: trip.tripCode },
            userId,
          },
          tx
        );

        return tx.trip.findUnique({
          where: { id: trip.id },
          include: {
            route: true,
            departurePoint: true,
            arrivalPoint: true,
            driver: true,
            vehicle: true,
            seats: true,
          },
        });
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }

  static async update(id: string, data: any) {
    await this.getById(id);
    return prisma.trip.update({
      where: { id },
      data,
      include: {
        route: true,
        departurePoint: true,
        arrivalPoint: true,
        driver: true,
        vehicle: true,
        seats: true,
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.trip.delete({
      where: { id },
    });
  }

  static async getSeats(tripId: string) {
    await SeatManager.cleanupExpiredSeats();

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: true,
        seats: {
          orderBy: { seatNumber: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError(`Trip with ID '${tripId}' not found`);
    }

    const now = Date.now();
    const seats = trip.seats.map((seat) => {
      const isHeld = seat.status === SEAT_STATUS.HELD && seat.heldExpiresAt && seat.heldExpiresAt.getTime() > now;
      const remainingSeconds = isHeld
        ? Math.max(0, Math.floor((seat.heldExpiresAt!.getTime() - now) / 1000))
        : 0;

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        numericSeatNumber: parseInt(seat.seatNumber, 10),
        status: isHeld ? SEAT_STATUS.HELD : seat.status,
        isAvailable: seat.status === SEAT_STATUS.AVAILABLE,
        isHeld: !!isHeld,
        isBooked: seat.status === SEAT_STATUS.BOOKED,
        heldExpiresAt: isHeld ? seat.heldExpiresAt : null,
        remainingSeconds,
      };
    });

    return {
      tripId: trip.id,
      tripCode: trip.tripCode,
      vehicle: {
        model: trip.vehicle.model,
        plateNumber: trip.vehicle.plateNumber,
        capacity: trip.capacity,
        seatLayout: trip.vehicle.seatLayout,
      },
      seats,
    };
  }

  static async holdSeats(tripId: string, seatNumbers: string[], referenceId: string, durationMinutes = 10) {
    const formattedSeatNumbers = seatNumbers.map((s) => String(s).padStart(2, '0'));
    return SeatManager.holdSeats(tripId, formattedSeatNumbers, referenceId, durationMinutes);
  }

  static async releaseSeats(tripId: string, seatNumbers: string[], referenceId: string) {
    const formattedSeatNumbers = seatNumbers.map((s) => String(s).padStart(2, '0'));
    return SeatManager.releaseSeats(tripId, formattedSeatNumbers, referenceId);
  }

  static async getManifest(tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        driver: true,
        vehicle: true,
        manifests: {
          include: {
            booking: true,
            checkedInByUser: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { seatNumber: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError(`Trip with ID '${tripId}' not found`);
    }

    return {
      tripId: trip.id,
      tripCode: trip.tripCode,
      route: trip.route.name,
      date: trip.departureDate,
      time: trip.departureTime,
      driver: trip.driver.fullName,
      vehicle: trip.vehicle.plateNumber,
      totalPassengers: trip.manifests.length,
      checkedInCount: trip.manifests.filter((m) => m.checkInStatus === CHECKIN_STATUS.CHECKED_IN).length,
      manifest: trip.manifests.map((m) => ({
        id: m.id,
        seatNumber: m.seatNumber,
        passengerName: m.passengerName,
        passengerPhone: m.passengerPhone,
        bookingCode: m.booking.bookingCode,
        bookingStatus: m.booking.bookingStatus,
        paymentStatus: m.booking.paymentStatus,
        checkInStatus: m.checkInStatus,
        checkedInAt: m.checkedInAt,
        checkedInBy: m.checkedInByUser,
        notes: m.notes,
      })),
    };
  }

  static async checkIn(tripId: string, manifestId: string, status: string, notes?: string, userId?: string) {
    const manifest = await prisma.manifest.findFirst({
      where: { id: manifestId, tripId },
      include: { trip: { include: { route: true } } },
    });

    if (!manifest) {
      throw new NotFoundError(`Manifest record with ID '${manifestId}' not found for trip '${tripId}'`);
    }

    const updated = await prisma.manifest.update({
      where: { id: manifestId },
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
        title: 'Penumpang check-in',
        description: `${manifest.passengerName} · Kursi ${manifest.seatNumber} (${manifest.trip.tripCode})`,
        metadata: { tripId, manifestId, seatNumber: manifest.seatNumber },
        userId,
      });
    }

    return updated;
  }
}
