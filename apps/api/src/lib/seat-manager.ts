import { prisma } from './prisma.js';
import { ConflictError, NotFoundError } from './errors.js';
import { SEAT_STATUS, BOOKING_STATUS } from '../config/constants.js';

export interface SeatHoldResult {
  tripId: string;
  heldSeats: string[];
  expiresAt: Date;
}

export class SeatManager {
  /**
   * Automatically release all expired seat holds and mark corresponding bookings as expired.
   */
  static async cleanupExpiredSeats(): Promise<number> {
    const now = new Date();

    // 1. Release expired trip seats
    const expiredSeats = await prisma.tripSeat.updateMany({
      where: {
        status: SEAT_STATUS.HELD,
        heldExpiresAt: {
          lt: now,
        },
      },
      data: {
        status: SEAT_STATUS.AVAILABLE,
        heldBy: null,
        heldExpiresAt: null,
      },
    });

    // 2. Mark waiting/held bookings whose hold expired as expired
    await prisma.booking.updateMany({
      where: {
        bookingStatus: {
          in: [BOOKING_STATUS.DRAFT, BOOKING_STATUS.SEAT_HELD, BOOKING_STATUS.WAITING_PAYMENT],
        },
        paymentStatus: {
          not: 'paid',
        },
        heldExpiresAt: {
          lt: now,
        },
      },
      data: {
        bookingStatus: BOOKING_STATUS.EXPIRED,
      },
    });

    return expiredSeats.count;
  }

  /**
   * Hold seats atomically within a transaction.
   * Prevents double-booking and concurrency race conditions.
   */
  static async holdSeats(
    tripId: string,
    seatNumbers: string[],
    referenceId: string,
    durationMinutes = 10
  ): Promise<SeatHoldResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    return await prisma.$transaction(
      async (tx) => {
        // Clean expired holds first in this tx
        await tx.tripSeat.updateMany({
          where: {
            tripId,
            status: SEAT_STATUS.HELD,
            heldExpiresAt: { lt: now },
          },
          data: {
            status: SEAT_STATUS.AVAILABLE,
            heldBy: null,
            heldExpiresAt: null,
          },
        });

        // Verify trip exists
        const trip = await tx.trip.findUnique({
          where: { id: tripId },
        });

        if (!trip) {
          throw new NotFoundError(`Trip with ID '${tripId}' not found`, 'TRIP_NOT_FOUND');
        }

        // Fetch the requested seats
        const seats = await tx.tripSeat.findMany({
          where: {
            tripId,
            seatNumber: { in: seatNumbers },
          },
        });

        if (seats.length !== seatNumbers.length) {
          const foundSeats = seats.map((s) => s.seatNumber);
          const missingSeats = seatNumbers.filter((s) => !foundSeats.includes(s));
          throw new NotFoundError(
            `Seats not found in trip: ${missingSeats.join(', ')}`,
            'SEATS_NOT_FOUND'
          );
        }

        // Check for conflicts
        const conflictingSeats: string[] = [];
        for (const seat of seats) {
          if (seat.status === SEAT_STATUS.BOOKED) {
            conflictingSeats.push(seat.seatNumber);
          } else if (
            seat.status === SEAT_STATUS.HELD &&
            seat.heldExpiresAt &&
            seat.heldExpiresAt > now &&
            seat.heldBy !== referenceId
          ) {
            conflictingSeats.push(seat.seatNumber);
          }
        }

        if (conflictingSeats.length > 0) {
          throw new ConflictError(
            `Seats already booked or held by another session: ${conflictingSeats.join(', ')}`,
            'SEAT_UNAVAILABLE',
            { conflictingSeats }
          );
        }

        // Lock/Hold the seats
        await tx.tripSeat.updateMany({
          where: {
            tripId,
            seatNumber: { in: seatNumbers },
          },
          data: {
            status: SEAT_STATUS.HELD,
            heldBy: referenceId,
            heldExpiresAt: expiresAt,
          },
        });

        return {
          tripId,
          heldSeats: seatNumbers,
          expiresAt,
        };
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }

  /**
   * Release seat hold explicitly.
   */
  static async releaseSeats(
    tripId: string,
    seatNumbers: string[],
    referenceId: string
  ): Promise<void> {
    await prisma.tripSeat.updateMany({
      where: {
        tripId,
        seatNumber: { in: seatNumbers },
        status: SEAT_STATUS.HELD,
        heldBy: referenceId,
      },
      data: {
        status: SEAT_STATUS.AVAILABLE,
        heldBy: null,
        heldExpiresAt: null,
      },
    });
  }

  /**
   * Confirm seats permanently to BOOKED status.
   */
  static async confirmSeats(
    tripId: string,
    seatNumbers: string[],
    bookingId: string
  ): Promise<void> {
    await prisma.tripSeat.updateMany({
      where: {
        tripId,
        seatNumber: { in: seatNumbers },
      },
      data: {
        status: SEAT_STATUS.BOOKED,
        heldBy: bookingId,
        heldExpiresAt: null,
      },
    });
  }
}
