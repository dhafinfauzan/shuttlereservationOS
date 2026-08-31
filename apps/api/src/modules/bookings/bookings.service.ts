import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../lib/errors.js';
import { SeatManager } from '../../lib/seat-manager.js';
import { ActivityService } from '../activity/activity.service.js';
import { generateBookingCode, getInitials } from '../../lib/code-generator.js';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SEAT_STATUS,
  CHECKIN_STATUS,
  ACTIVITY_TYPE,
} from '../../config/constants.js';

export class BookingsService {
  static async list(params: {
    status?: string;
    date?: string;
    tripId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    await SeatManager.cleanupExpiredSeats();

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status && params.status !== 'Semua' && params.status !== 'all') {
      const statusMap: Record<string, string> = {
        Lunas: BOOKING_STATUS.PAID,
        Menunggu: BOOKING_STATUS.WAITING_PAYMENT,
        Batal: BOOKING_STATUS.CANCELLED,
        Expired: BOOKING_STATUS.EXPIRED,
      };
      where.bookingStatus = statusMap[params.status] || params.status;
    }

    if (params.date) {
      where.trip = { departureDate: params.date };
    }

    if (params.tripId) {
      where.tripId = params.tripId;
    }

    if (params.search) {
      where.OR = [
        { bookingCode: { contains: params.search } },
        { customerName: { contains: params.search } },
        { customerPhone: { contains: params.search } },
        { customerEmail: { contains: params.search } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          trip: {
            include: {
              route: true,
              departurePoint: true,
              arrivalPoint: true,
              driver: true,
              vehicle: true,
            },
          },
          seats: true,
          manifests: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formatted = items.map((booking) => {
      const seatList = booking.seats.map((s) => s.seatNumber).join(', ');
      
      let displayStatus = 'Menunggu';
      if (booking.bookingStatus === BOOKING_STATUS.PAID || booking.paymentStatus === PAYMENT_STATUS.PAID) {
        displayStatus = 'Lunas';
      } else if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
        displayStatus = 'Batal';
      } else if (booking.bookingStatus === BOOKING_STATUS.EXPIRED) {
        displayStatus = 'Expired';
      }

      return {
        id: booking.id,
        code: booking.bookingCode,
        bookingCode: booking.bookingCode,
        name: booking.customerName,
        customerName: booking.customerName,
        phone: booking.customerPhone,
        email: booking.customerEmail,
        route: booking.trip.route.name,
        routeDetails: `${booking.trip.departurePoint.name} · ${booking.trip.arrivalPoint.name}`,
        date: booking.trip.departureDate,
        time: booking.trip.departureTime,
        seat: seatList,
        seats: booking.seats.map((s) => s.seatNumber),
        amount: booking.totalAmount,
        totalAmount: booking.totalAmount,
        status: displayStatus,
        rawStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        avatar: booking.avatar || getInitials(booking.customerName),
        heldExpiresAt: booking.heldExpiresAt,
        paidAt: booking.paidAt,
        createdAt: booking.createdAt,
        trip: {
          id: booking.trip.id,
          tripCode: booking.trip.tripCode,
          departureTime: booking.trip.departureTime,
          arrivalTime: booking.trip.arrivalTime,
          departureDate: booking.trip.departureDate,
          timezone: booking.trip.timezone,
          vehiclePlate: booking.trip.vehicle.plateNumber,
          driverName: booking.trip.driver.fullName,
        },
      };
    });

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getByIdOrCode(idOrCode: string) {
    await SeatManager.cleanupExpiredSeats();

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: idOrCode }, { bookingCode: idOrCode }],
      },
      include: {
        trip: {
          include: {
            route: true,
            departurePoint: true,
            arrivalPoint: true,
            driver: true,
            vehicle: true,
          },
        },
        seats: {
          include: { tripSeat: true },
        },
        manifests: true,
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking '${idOrCode}' not found`);
    }

    let displayStatus = 'Menunggu';
    if (booking.bookingStatus === BOOKING_STATUS.PAID || booking.paymentStatus === PAYMENT_STATUS.PAID) {
      displayStatus = 'Lunas';
    } else if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      displayStatus = 'Batal';
    } else if (booking.bookingStatus === BOOKING_STATUS.EXPIRED) {
      displayStatus = 'Expired';
    }

    return {
      ...booking,
      displayStatus,
      seatList: booking.seats.map((s) => s.seatNumber).join(', '),
      avatar: booking.avatar || getInitials(booking.customerName),
    };
  }

  static async create(data: any, userId?: string) {
    const formattedSeatNumbers = data.seatNumbers.map((s: string) => String(s).padStart(2, '0'));
    const seatPrimary = formattedSeatNumbers[0];

    return prisma.$transaction(
      async (tx) => {
        const trip = await tx.trip.findUnique({
          where: { id: data.tripId },
          include: { route: true },
        });

        if (!trip) {
          throw new NotFoundError(`Trip with ID '${data.tripId}' not found`);
        }

        const seats = await tx.tripSeat.findMany({
          where: {
            tripId: data.tripId,
            seatNumber: { in: formattedSeatNumbers },
          },
        });

        if (seats.length !== formattedSeatNumbers.length) {
          throw new BadRequestError('Some selected seats do not exist for this trip');
        }

        const now = new Date();
        const conflict = seats.find(
          (s) =>
            s.status === SEAT_STATUS.BOOKED ||
            (s.status === SEAT_STATUS.HELD && s.heldExpiresAt && s.heldExpiresAt > now)
        );

        if (conflict) {
          throw new ConflictError(
            `Seat ${conflict.seatNumber} is already occupied or held by another customer`,
            'SEAT_CONFLICT',
            { conflictingSeat: conflict.seatNumber }
          );
        }

        const bookingCode = generateBookingCode(trip.departureDate, seatPrimary);
        const totalAmount = trip.basePrice * formattedSeatNumbers.length;
        const avatar = getInitials(data.customerName);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const booking = await tx.booking.create({
          data: {
            bookingCode,
            tripId: trip.id,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            passengerCount: formattedSeatNumbers.length,
            totalAmount,
            paymentMethod: data.paymentMethod || 'QRIS',
            paymentStatus: PAYMENT_STATUS.UNPAID,
            bookingStatus: BOOKING_STATUS.WAITING_PAYMENT,
            heldExpiresAt: expiresAt,
            avatar,
            notes: data.notes,
          },
        });

        for (const seat of seats) {
          await tx.tripSeat.update({
            where: { id: seat.id },
            data: {
              status: SEAT_STATUS.HELD,
              heldBy: booking.id,
              heldExpiresAt: expiresAt,
            },
          });

          await tx.bookingSeat.create({
            data: {
              bookingId: booking.id,
              tripSeatId: seat.id,
              seatNumber: seat.seatNumber,
              passengerName:
                data.passengerNames?.[formattedSeatNumbers.indexOf(seat.seatNumber)] || data.customerName,
              price: trip.basePrice,
            },
          });

          await tx.manifest.create({
            data: {
              tripId: trip.id,
              bookingId: booking.id,
              seatNumber: seat.seatNumber,
              passengerName:
                data.passengerNames?.[formattedSeatNumbers.indexOf(seat.seatNumber)] || data.customerName,
              passengerPhone: data.customerPhone,
              checkInStatus: CHECKIN_STATUS.PENDING,
            },
          });
        }

        await ActivityService.log(
          {
            type: ACTIVITY_TYPE.BOOKED,
            title: 'Pemesanan baru',
            description: `${booking.bookingCode} · ${booking.customerName}`,
            metadata: {
              bookingCode: booking.bookingCode,
              customerName: booking.customerName,
              amount: booking.totalAmount,
              tripId: trip.id,
            },
            userId,
          },
          tx
        );

        return tx.booking.findUnique({
          where: { id: booking.id },
          include: {
            trip: {
              include: {
                route: true,
                departurePoint: true,
                arrivalPoint: true,
                driver: true,
                vehicle: true,
              },
            },
            seats: true,
          },
        });
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }

  static async update(id: string, data: any) {
    const booking = await this.getByIdOrCode(id);

    return prisma.$transaction(
      async (tx) => {
        const updated = await tx.booking.update({
          where: { id: booking.id },
          data,
        });

        if (data.bookingStatus === BOOKING_STATUS.PAID || data.paymentStatus === PAYMENT_STATUS.PAID) {
          const seats = await tx.bookingSeat.findMany({ where: { bookingId: booking.id } });
          for (const s of seats) {
            await tx.tripSeat.update({
              where: { id: s.tripSeatId },
              data: {
                status: SEAT_STATUS.BOOKED,
                heldExpiresAt: null,
              },
            });
          }
        }

        return updated;
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }

  static async cancel(idOrCode: string, reason?: string, userId?: string) {
    const booking = await this.getByIdOrCode(idOrCode);

    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      return booking;
    }

    return prisma.$transaction(
      async (tx) => {
        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: {
            bookingStatus: BOOKING_STATUS.CANCELLED,
            paymentStatus:
              booking.paymentStatus === PAYMENT_STATUS.PAID ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.FAILED,
            cancelledAt: new Date(),
            cancelReason: reason || 'Cancelled by admin / customer',
          },
        });

        const bookingSeats = await tx.bookingSeat.findMany({
          where: { bookingId: booking.id },
        });

        for (const bs of bookingSeats) {
          await tx.tripSeat.update({
            where: { id: bs.tripSeatId },
            data: {
              status: SEAT_STATUS.AVAILABLE,
              heldBy: null,
              heldExpiresAt: null,
            },
          });
        }

        await tx.manifest.deleteMany({
          where: { bookingId: booking.id },
        });

        await ActivityService.log(
          {
            type: ACTIVITY_TYPE.CANCEL,
            title: 'Pemesanan dibatalkan',
            description: `${booking.bookingCode} · ${booking.customerName}`,
            metadata: {
              bookingCode: booking.bookingCode,
              reason,
            },
            userId,
          },
          tx
        );

        return updated;
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }

  static async reschedule(
    idOrCode: string,
    newTripId: string,
    newSeatNumbers: string[],
    userId?: string
  ) {
    const booking = await this.getByIdOrCode(idOrCode);
    const formattedNewSeats = newSeatNumbers.map((s) => String(s).padStart(2, '0'));

    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      throw new BadRequestError('Cannot reschedule a cancelled booking');
    }

    return prisma.$transaction(
      async (tx) => {
        const newTrip = await tx.trip.findUnique({
          where: { id: newTripId },
          include: { route: true },
        });

        if (!newTrip) {
          throw new NotFoundError(`Target trip '${newTripId}' not found`);
        }

        const targetSeats = await tx.tripSeat.findMany({
          where: {
            tripId: newTripId,
            seatNumber: { in: formattedNewSeats },
          },
        });

        if (targetSeats.length !== formattedNewSeats.length) {
          throw new BadRequestError('One or more selected new seats do not exist');
        }

        const now = new Date();
        const conflict = targetSeats.find(
          (s) =>
            s.status === SEAT_STATUS.BOOKED ||
            (s.status === SEAT_STATUS.HELD && s.heldExpiresAt && s.heldExpiresAt > now)
        );

        if (conflict) {
          throw new ConflictError(`Target seat ${conflict.seatNumber} is unavailable`);
        }

        const oldSeats = await tx.bookingSeat.findMany({
          where: { bookingId: booking.id },
        });
        for (const os of oldSeats) {
          await tx.tripSeat.update({
            where: { id: os.tripSeatId },
            data: {
              status: SEAT_STATUS.AVAILABLE,
              heldBy: null,
              heldExpiresAt: null,
            },
          });
        }

        await tx.bookingSeat.deleteMany({ where: { bookingId: booking.id } });
        await tx.manifest.deleteMany({ where: { bookingId: booking.id } });

        const newTotal = newTrip.basePrice * formattedNewSeats.length;

        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: {
            tripId: newTrip.id,
            passengerCount: formattedNewSeats.length,
            totalAmount: newTotal,
          },
        });

        const isPaid = booking.bookingStatus === BOOKING_STATUS.PAID;
        const targetSeatStatus = isPaid ? SEAT_STATUS.BOOKED : SEAT_STATUS.HELD;

        for (const targetSeat of targetSeats) {
          await tx.tripSeat.update({
            where: { id: targetSeat.id },
            data: {
              status: targetSeatStatus,
              heldBy: booking.id,
              heldExpiresAt: isPaid ? null : new Date(Date.now() + 10 * 60 * 1000),
            },
          });

          await tx.bookingSeat.create({
            data: {
              bookingId: booking.id,
              tripSeatId: targetSeat.id,
              seatNumber: targetSeat.seatNumber,
              passengerName: booking.customerName,
              price: newTrip.basePrice,
            },
          });

          await tx.manifest.create({
            data: {
              tripId: newTrip.id,
              bookingId: booking.id,
              seatNumber: targetSeat.seatNumber,
              passengerName: booking.customerName,
              passengerPhone: booking.customerPhone,
              checkInStatus: CHECKIN_STATUS.PENDING,
            },
          });
        }

        await ActivityService.log(
          {
            type: ACTIVITY_TYPE.TRIP_UPDATE,
            title: 'Jadwal pemesanan diubah (Reschedule)',
            description: `${booking.bookingCode} · Ke ${newTrip.route.name} (${newTrip.departureTime} WIB)`,
            metadata: {
              bookingCode: booking.bookingCode,
              oldTripId: booking.tripId,
              newTripId: newTrip.id,
            },
            userId,
          },
          tx
        );

        return updatedBooking;
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }
}
