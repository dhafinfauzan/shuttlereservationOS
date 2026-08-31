import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError, ConflictError, UnauthorizedError } from '../../lib/errors.js';
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

export class PublicService {
  static async searchSchedules(from = 'Jakarta', to = 'Bandung', dateStr?: string, passengers = 1) {
    await SeatManager.cleanupExpiredSeats();

    const date = dateStr || new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const routes = await prisma.route.findMany({
      where: {
        originCity: { contains: from },
        destinationCity: { contains: to },
        isActive: true,
      },
    });

    const routeIds = routes.map((r) => r.id);
    if (routeIds.length === 0) return [];

    const trips = await prisma.trip.findMany({
      where: {
        routeId: { in: routeIds },
        departureDate: date,
        status: { not: 'cancelled' },
      },
      include: {
        route: true,
        departurePoint: true,
        arrivalPoint: true,
        vehicle: true,
        driver: true,
        seats: true,
      },
      orderBy: { departureTime: 'asc' },
    });

    const formatRupiah = (val: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(val);

    return trips.map((trip, index) => {
      const sold = trip.seats.filter((s) => s.status === SEAT_STATUS.BOOKED).length;
      const held = trip.seats.filter((s) => s.status === SEAT_STATUS.HELD).length;
      const availableSeats = Math.max(0, trip.capacity - sold - held);

      let label = trip.label;
      if (!label) {
        if (index === 0) label = 'Pagi';
        else if (index === 1) label = 'Favorit';
        else label = 'Sore';
      }

      return {
        id: trip.id,
        tripCode: trip.tripCode,
        routeId: trip.routeId,
        from: trip.route.originCity,
        to: trip.route.destinationCity,
        originPoint: trip.departurePoint.name,
        destinationPoint: trip.arrivalPoint.name,
        pointDescription: `${trip.departurePoint.name} · ${trip.arrivalPoint.name}`,
        date: trip.departureDate,
        time: trip.departureTime,
        departureTime: trip.departureTime,
        arrival: trip.arrivalTime,
        arrivalTime: trip.arrivalTime,
        duration: '2j 45m',
        timezone: trip.timezone,
        departurePoint: trip.departurePoint.name,
        arrivalPoint: trip.arrivalPoint.name,
        price: trip.basePrice,
        formattedPrice: formatRupiah(trip.basePrice),
        label,
        seats: availableSeats,
        capacity: trip.capacity,
        sold,
        isAvailable: availableSeats >= passengers,
        vehicle: {
          model: trip.vehicle.model,
          plateNumber: trip.vehicle.plateNumber,
        },
      };
    });
  }

  static async getScheduleSeats(tripId: string) {
    await SeatManager.cleanupExpiredSeats();

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        departurePoint: true,
        arrivalPoint: true,
        vehicle: true,
        seats: { orderBy: { seatNumber: 'asc' } },
      },
    });

    if (!trip) {
      throw new NotFoundError(`Schedule with ID '${tripId}' not found`);
    }

    const now = Date.now();
    const unavailableList: number[] = [];

    const seats = trip.seats.map((seat) => {
      const num = parseInt(seat.seatNumber, 10);
      const isHeld = seat.status === SEAT_STATUS.HELD && seat.heldExpiresAt && seat.heldExpiresAt.getTime() > now;
      const isBooked = seat.status === SEAT_STATUS.BOOKED;

      if (isHeld || isBooked) {
        unavailableList.push(num);
      }

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        number: num,
        status: isHeld ? SEAT_STATUS.HELD : seat.status,
        isAvailable: seat.status === SEAT_STATUS.AVAILABLE,
        isHeld: !!isHeld,
        isBooked,
        heldExpiresAt: isHeld ? seat.heldExpiresAt : null,
      };
    });

    return {
      tripId: trip.id,
      tripCode: trip.tripCode,
      route: trip.route.name,
      origin: trip.departurePoint.name,
      destination: trip.arrivalPoint.name,
      time: trip.departureTime,
      date: trip.departureDate,
      price: trip.basePrice,
      capacity: trip.capacity,
      unavailable: unavailableList,
      seats,
    };
  }

  static async createBooking(data: any) {
    const seatNumbers = data.seatNumbers.map((s: string | number) => String(s).padStart(2, '0'));
    const seatPrimary = seatNumbers[0];

    return prisma.$transaction(
      async (tx) => {
        const trip = await tx.trip.findUnique({
          where: { id: data.tripId },
          include: {
            route: true,
            departurePoint: true,
            arrivalPoint: true,
          },
        });

        if (!trip) {
          throw new NotFoundError(`Schedule '${data.tripId}' not found`);
        }

        const seats = await tx.tripSeat.findMany({
          where: {
            tripId: data.tripId,
            seatNumber: { in: seatNumbers },
          },
        });

        if (seats.length !== seatNumbers.length) {
          throw new BadRequestError('Invalid seat selection');
        }

        const now = new Date();
        const conflict = seats.find(
          (s) =>
            s.status === SEAT_STATUS.BOOKED ||
            (s.status === SEAT_STATUS.HELD && s.heldExpiresAt && s.heldExpiresAt > now)
        );

        if (conflict) {
          throw new ConflictError(
            `Kursi ${conflict.seatNumber} sudah tidak tersedia atau sedang dipilih pelanggan lain.`,
            'SEAT_UNAVAILABLE',
            { conflictingSeat: conflict.seatNumber }
          );
        }

        const bookingCode = generateBookingCode(trip.departureDate, seatPrimary);
        const accessToken = crypto.randomBytes(32).toString('hex');
        const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
        const totalAmount = trip.basePrice * seatNumbers.length;
        const avatar = getInitials(data.customerName);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const booking = await tx.booking.create({
          data: {
            bookingCode,
            tripId: trip.id,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            accessTokenHash,
            passengerCount: seatNumbers.length,
            totalAmount,
            paymentMethod: 'QRIS',
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
              passengerName: data.customerName,
              price: trip.basePrice,
            },
          });

          await tx.manifest.create({
            data: {
              tripId: trip.id,
              bookingId: booking.id,
              seatNumber: seat.seatNumber,
              passengerName: data.customerName,
              passengerPhone: data.customerPhone,
              checkInStatus: CHECKIN_STATUS.PENDING,
            },
          });
        }

        const qrisDummyPayload = `00020101021226580016ID.CO.KELANA.WWW0118936009990000000000520458125303360540${totalAmount}5802ID5913KELANA NOVA6007JAKARTA62070703A016304${bookingCode.replace(/-/g, '')}`;

        return {
          id: booking.id,
          bookingCode: booking.bookingCode,
          accessToken,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          route: trip.route.name,
          date: trip.departureDate,
          time: trip.departureTime,
          departurePoint: trip.departurePoint.name,
          arrivalPoint: trip.arrivalPoint.name,
          seatNumbers,
          seats: seatNumbers.join(', '),
          totalAmount,
          paymentMethod: booking.paymentMethod,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          heldExpiresAt: expiresAt,
          expiryCountdownSeconds: 600,
          qrisPayload: qrisDummyPayload,
          isSimulation: true,
        };
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }

  private static assertBookingAccess(accessTokenHash: string | null, accessToken?: string) {
    if (!accessTokenHash || !accessToken) {
      throw new UnauthorizedError('Booking access token is missing or invalid', 'INVALID_BOOKING_TOKEN');
    }
    const suppliedHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const expected = Buffer.from(accessTokenHash);
    const supplied = Buffer.from(suppliedHash);
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      throw new UnauthorizedError('Booking access token is missing or invalid', 'INVALID_BOOKING_TOKEN');
    }
  }

  static async getBookingTicket(bookingCode: string, accessToken?: string) {
    await SeatManager.cleanupExpiredSeats();

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        trip: {
          include: {
            route: true,
            departurePoint: true,
            arrivalPoint: true,
            vehicle: true,
            driver: true,
          },
        },
        seats: true,
        manifests: true,
      },
    });

    if (!booking) {
      throw new NotFoundError(`Tiket dengan kode booking '${bookingCode}' tidak ditemukan`);
    }

    this.assertBookingAccess(booking.accessTokenHash, accessToken);

    const isPaid = booking.bookingStatus === BOOKING_STATUS.PAID || booking.paymentStatus === PAYMENT_STATUS.PAID;
    const isExpired = booking.bookingStatus === BOOKING_STATUS.EXPIRED;
    const isCancelled = booking.bookingStatus === BOOKING_STATUS.CANCELLED;

    const remainingSeconds = booking.heldExpiresAt
      ? Math.max(0, Math.floor((booking.heldExpiresAt.getTime() - Date.now()) / 1000))
      : 0;

    return {
      bookingCode: booking.bookingCode,
      status: isPaid ? 'Lunas' : isCancelled ? 'Batal' : isExpired ? 'Expired' : 'Menunggu Pembayaran',
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      isPaid,
      customer: {
        name: booking.customerName,
        phone: booking.customerPhone,
        email: booking.customerEmail,
        avatar: booking.avatar || getInitials(booking.customerName),
      },
      trip: {
        route: booking.trip.route.name,
        originCity: booking.trip.route.originCity,
        destinationCity: booking.trip.route.destinationCity,
        departurePoint: booking.trip.departurePoint.name,
        departureAddress: booking.trip.departurePoint.address,
        arrivalPoint: booking.trip.arrivalPoint.name,
        arrivalAddress: booking.trip.arrivalPoint.address,
        date: booking.trip.departureDate,
        departureTime: booking.trip.departureTime,
        arrivalTime: booking.trip.arrivalTime,
        timezone: booking.trip.timezone,
        driver: booking.trip.driver.fullName,
        vehicle: booking.trip.vehicle.plateNumber,
      },
      seats: booking.seats.map((s) => s.seatNumber),
      seatString: booking.seats.map((s) => s.seatNumber).join(', '),
      totalAmount: booking.totalAmount,
      heldExpiresAt: booking.heldExpiresAt,
      remainingSeconds,
      paidAt: booking.paidAt,
      ticketSummary: `${booking.trip.departureTime} WIB · Kursi ${booking.seats.map((s) => s.seatNumber).join(', ')}`,
    };
  }

  static async simulatePayment(bookingCode: string, accessToken?: string) {
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        trip: { include: { route: true } },
        seats: true,
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with code '${bookingCode}' not found`);
    }

    this.assertBookingAccess(booking.accessTokenHash, accessToken);

    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      throw new BadRequestError('Cannot pay for a cancelled booking');
    }

    if (booking.bookingStatus === BOOKING_STATUS.PAID) {
      return {
        success: true,
        alreadyPaid: true,
        bookingCode,
        message: 'Booking is already paid',
      };
    }

    return prisma.$transaction(
      async (tx) => {
        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: PAYMENT_STATUS.PAID,
            bookingStatus: BOOKING_STATUS.PAID,
            paidAt: new Date(),
            heldExpiresAt: null,
          },
        });

        for (const bs of booking.seats) {
          await tx.tripSeat.update({
            where: { id: bs.tripSeatId },
            data: {
              status: SEAT_STATUS.BOOKED,
              heldExpiresAt: null,
            },
          });
        }

        await ActivityService.log(
          {
            type: ACTIVITY_TYPE.PAID,
            title: 'Pembayaran diterima',
            description: `${booking.bookingCode} · ${booking.customerName}`,
            metadata: {
              bookingCode: booking.bookingCode,
              customerName: booking.customerName,
              amount: booking.totalAmount,
              method: 'QRIS_SIMULATION',
            },
          },
          tx
        );

        return {
          success: true,
          bookingCode: updated.bookingCode,
          status: updated.bookingStatus,
          paymentStatus: updated.paymentStatus,
          paidAt: updated.paidAt,
          message: 'Payment simulation successful. Booking is now confirmed (PAID).',
        };
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }
}
