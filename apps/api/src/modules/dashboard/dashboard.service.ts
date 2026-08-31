import { prisma } from '../../lib/prisma.js';
import { SeatManager } from '../../lib/seat-manager.js';
import { ActivityService } from '../activity/activity.service.js';
import { BOOKING_STATUS, PAYMENT_STATUS, SEAT_STATUS } from '../../config/constants.js';

export class DashboardService {
  static async getSummary(dateStr?: string) {
    await SeatManager.cleanupExpiredSeats();

    // Default to '2026-08-31' or today
    const date = dateStr || new Date().toISOString().split('T')[0];

    // Find all trips for the date
    const trips = await prisma.trip.findMany({
      where: { departureDate: date },
      include: {
        seats: true,
        bookings: {
          include: { seats: true },
        },
      },
    });

    // Bookings for date or all bookings
    const bookings = await prisma.booking.findMany({
      where: {
        trip: { departureDate: date },
      },
    });

    const paidBookings = bookings.filter(
      (b) => b.bookingStatus === BOOKING_STATUS.PAID || b.paymentStatus === PAYMENT_STATUS.PAID
    );

    const revenueToday = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const passengersToday = paidBookings.reduce((sum, b) => sum + b.passengerCount, 0);

    let totalCapacity = 0;
    let soldSeats = 0;
    let heldSeats = 0;

    for (const trip of trips) {
      totalCapacity += trip.capacity;
      soldSeats += trip.seats.filter((s) => s.status === SEAT_STATUS.BOOKED).length;
      heldSeats += trip.seats.filter((s) => s.status === SEAT_STATUS.HELD).length;
    }

    const availableSeatsToday = Math.max(0, totalCapacity - soldSeats - heldSeats);
    const revenueMillions = (revenueToday / 1000000).toFixed(2).replace('.', ',');
    const formattedRevenue = `Rp ${revenueMillions}jt`;
    const operationalTime = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date());

    return {
      date,
      operationalTime: `${operationalTime} WIB`,
      tripsCount: trips.length,
      metrics: {
        bookings: {
          label: 'Pemesanan hari ini',
          value: bookings.length,
          note: 'data aktual',
          icon: 'ticket',
          tone: 'red',
          down: false,
        },
        revenue: {
          label: 'Pendapatan hari ini',
          value: formattedRevenue,
          raw: revenueToday,
          note: 'data aktual',
          icon: 'wallet',
          tone: 'navy',
          down: false,
        },
        passengers: {
          label: 'Penumpang',
          value: passengersToday,
          raw: passengersToday,
          note: 'data aktual',
          icon: 'users',
          tone: 'sand',
          down: false,
        },
        availableSeats: {
          label: 'Kursi tersedia',
          value: availableSeatsToday,
          raw: availableSeatsToday,
          note: `${heldSeats} ditahan`,
          icon: 'seat',
          tone: 'green',
          down: true,
        },
      },
    };
  }

  static async getRevenue(periodDays = 7) {
    const days = Math.min(30, Math.max(7, periodDays));
    const today = new Date();
    const dates = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - index));
      return date.toISOString().slice(0, 10);
    });
    const bookings = await prisma.booking.findMany({
      where: {
        trip: { departureDate: { in: dates } },
        OR: [{ bookingStatus: BOOKING_STATUS.PAID }, { paymentStatus: PAYMENT_STATUS.PAID }],
      },
      include: { trip: true },
    });
    const amounts = dates.map((date) => bookings
      .filter((booking) => booking.trip.departureDate === date)
      .reduce((sum, booking) => sum + booking.totalAmount, 0));
    const maxAmount = Math.max(...amounts, 1);
    const totalRevenue = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
      periodDays: days,
      totalRevenue,
      formattedTotal: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalRevenue),
      percentageChange: null,
      yLabels: [maxAmount, Math.round(maxAmount / 2), 0],
      bars: amounts.map((amount, i) => ({
        index: i,
        height: Math.round((amount / maxAmount) * 100),
        dayLabel: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${dates[i]}T12:00:00`)).slice(0, 1),
        isFocus: i === amounts.length - 1,
        amountLabel: new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(amount),
        amount,
        date: dates[i],
      })),
    };
  }

  static async getOccupancy(dateStr?: string) {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const trips = await prisma.trip.findMany({
      where: { departureDate: date },
      include: { seats: true },
    });

    let totalCapacity = 0;
    let soldSeats = 0;

    for (const trip of trips) {
      totalCapacity += trip.capacity;
      soldSeats += trip.seats.filter((s) => s.status === SEAT_STATUS.BOOKED).length;
    }

    const availableSeats = Math.max(0, totalCapacity - soldSeats);
    const percent = totalCapacity === 0 ? 0 : Math.round((soldSeats / totalCapacity) * 100);

    return {
      date,
      occupancyPercentage: `${percent}%`,
      percentNumber: percent,
      soldSeats,
      availableSeats,
      totalCapacity,
      summaryText: `${soldSeats} dari ${totalCapacity} kursi`,
      note: 'Berdasarkan jadwal hari ini',
    };
  }

  static async getActivity(limit = 10) {
    return ActivityService.getRecent(limit);
  }
}
