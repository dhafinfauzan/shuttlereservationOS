import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase(client?: PrismaClient) {
  const db = client || prisma;
  console.log('🌱 Starting Kelana Nova database seed...');

  // 1. Clean existing data
  await prisma.activityLog.deleteMany({});
  await prisma.paymentWebhookLog.deleteMany({});
  await prisma.manifest.deleteMany({});
  await prisma.bookingSeat.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.tripSeat.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.routePoint.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.point.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✓ Cleared previous database records');

  // 2. Users (Owner, Admin CS Rani Putri, Driver Nugraha)
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const ownerPasswordHash = await bcrypt.hash('Owner123!', 10);
  const driverPasswordHash = await bcrypt.hash('Driver123!', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@kelana.test',
      passwordHash: ownerPasswordHash,
      name: 'Budi Santoso',
      role: 'owner',
      avatar: 'BS',
      phone: '0811-1000-001',
    },
  });

  const rani = await prisma.user.create({
    data: {
      email: 'rani@kelana.test',
      passwordHash: passwordHash,
      name: 'Rani Putri',
      role: 'admin_cs',
      avatar: 'RP',
      phone: '0812-3456-7890',
    },
  });

  const driverUser1 = await prisma.user.create({
    data: {
      email: 'driver.nugraha@kelana.test',
      passwordHash: driverPasswordHash,
      name: 'A. Nugraha',
      role: 'driver',
      avatar: 'AN',
      phone: '0812-1111-2222',
    },
  });

  const driverUser2 = await prisma.user.create({
    data: {
      email: 'driver.ramadhan@kelana.test',
      passwordHash: driverPasswordHash,
      name: 'F. Ramadhan',
      role: 'driver',
      avatar: 'FR',
      phone: '0812-3333-4444',
    },
  });

  console.log('✓ Seeded Users: Owner (owner@kelana.test), Admin (rani@kelana.test), Drivers');

  // 3. Points (Blok M, Pasteur, Bekasi Barat)
  const pointBlokM = await prisma.point.create({
    data: {
      name: 'Blok M',
      city: 'Jakarta',
      address: 'Jl. Panglima Polim No. 12, Melawai, Kebayoran Baru, Jakarta Selatan',
      type: 'both',
      latitude: -6.2443,
      longitude: 106.7989,
    },
  });

  const pointPasteur = await prisma.point.create({
    data: {
      name: 'Pasteur',
      city: 'Bandung',
      address: 'Jl. Dr. Djunjunan No. 143-149, Pasteur, Sukajadi, Kota Bandung',
      type: 'both',
      latitude: -6.8942,
      longitude: 107.5794,
    },
  });

  const pointBekasi = await prisma.point.create({
    data: {
      name: 'Bekasi Barat',
      city: 'Bekasi',
      address: 'Jl. Jend. Ahmad Yani No. 1, Marga Jaya, Bekasi Selatan',
      type: 'both',
      latitude: -6.2415,
      longitude: 106.9924,
    },
  });

  console.log('✓ Seeded Points: Blok M (Jakarta), Pasteur (Bandung), Bekasi Barat (Bekasi)');

  // 4. Routes
  const routeJktBdg = await prisma.route.create({
    data: {
      name: 'Jakarta → Bandung',
      originCity: 'Jakarta',
      destinationCity: 'Bandung',
      distanceKm: 150,
      estimatedMinutes: 165,
    },
  });

  const routeBdgJkt = await prisma.route.create({
    data: {
      name: 'Bandung → Jakarta',
      originCity: 'Bandung',
      destinationCity: 'Jakarta',
      distanceKm: 150,
      estimatedMinutes: 165,
    },
  });

  const routeBksBdg = await prisma.route.create({
    data: {
      name: 'Bekasi → Bandung',
      originCity: 'Bekasi',
      destinationCity: 'Bandung',
      distanceKm: 135,
      estimatedMinutes: 150,
    },
  });

  // Link route points
  await prisma.routePoint.createMany({
    data: [
      { routeId: routeJktBdg.id, pointId: pointBlokM.id, sequence: 1, type: 'pickup' },
      { routeId: routeJktBdg.id, pointId: pointPasteur.id, sequence: 2, type: 'dropoff' },
      { routeId: routeBdgJkt.id, pointId: pointPasteur.id, sequence: 1, type: 'pickup' },
      { routeId: routeBdgJkt.id, pointId: pointBlokM.id, sequence: 2, type: 'dropoff' },
      { routeId: routeBksBdg.id, pointId: pointBekasi.id, sequence: 1, type: 'pickup' },
      { routeId: routeBksBdg.id, pointId: pointPasteur.id, sequence: 2, type: 'dropoff' },
    ],
  });

  console.log('✓ Seeded Routes: Jakarta → Bandung, Bandung → Jakarta, Bekasi → Bandung');

  // 5. Vehicles (B 7124 KLN, B 7031 KLN, B 7140 KLN, B 7098 KLN)
  const vehicle1 = await prisma.vehicle.create({
    data: {
      plateNumber: 'B 7124 KLN',
      model: 'Toyota HiAce Premio Executive',
      capacity: 12,
      seatLayout: '2-1',
      status: 'active',
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      plateNumber: 'B 7031 KLN',
      model: 'Toyota HiAce Premio Executive',
      capacity: 12,
      seatLayout: '2-1',
      status: 'active',
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      plateNumber: 'B 7140 KLN',
      model: 'Toyota HiAce Premio Executive',
      capacity: 12,
      seatLayout: '2-1',
      status: 'active',
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      plateNumber: 'B 7098 KLN',
      model: 'Toyota HiAce Premio Executive',
      capacity: 12,
      seatLayout: '2-1',
      status: 'active',
    },
  });

  console.log('✓ Seeded 4 Vehicles (HiAce 12 Seats)');

  // 6. Drivers (A. Nugraha, F. Ramadhan, D. Permana, R. Akbar)
  const driver1 = await prisma.driver.create({
    data: {
      userId: driverUser1.id,
      fullName: 'A. Nugraha',
      phone: '0812-1111-2222',
      licenseNumber: 'SIM-B1-992140',
      avatarInitials: 'AN',
      status: 'active',
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      userId: driverUser2.id,
      fullName: 'F. Ramadhan',
      phone: '0812-3333-4444',
      licenseNumber: 'SIM-B1-992141',
      avatarInitials: 'FR',
      status: 'active',
    },
  });

  const driver3 = await prisma.driver.create({
    data: {
      fullName: 'D. Permana',
      phone: '0812-5555-6666',
      licenseNumber: 'SIM-B1-992142',
      avatarInitials: 'DP',
      status: 'active',
    },
  });

  const driver4 = await prisma.driver.create({
    data: {
      fullName: 'R. Akbar',
      phone: '0812-7777-8888',
      licenseNumber: 'SIM-B1-992143',
      avatarInitials: 'RA',
      status: 'active',
    },
  });

  console.log('✓ Seeded 4 Drivers');

  // Helper function to create trip with 12 seats
  async function createTripWithSeats(params: {
    tripCode: string;
    routeId: string;
    vehicleId: string;
    driverId: string;
    departurePointId: string;
    arrivalPointId: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
    label?: string;
    status: string;
    occupiedSeats?: number[];
  }) {
    const trip = await prisma.trip.create({
      data: {
        tripCode: params.tripCode,
        routeId: params.routeId,
        vehicleId: params.vehicleId,
        driverId: params.driverId,
        departurePointId: params.departurePointId,
        arrivalPointId: params.arrivalPointId,
        departureDate: params.departureDate,
        departureTime: params.departureTime,
        arrivalTime: params.arrivalTime,
        timezone: 'WIB',
        basePrice: params.basePrice,
        capacity: 12,
        label: params.label,
        status: params.status,
      },
    });

    const occupied = params.occupiedSeats || [];
    for (let i = 1; i <= 12; i++) {
      const seatNum = String(i).padStart(2, '0');
      const isOccupied = occupied.includes(i);
      await prisma.tripSeat.create({
        data: {
          tripId: trip.id,
          seatNumber: seatNum,
          status: isOccupied ? 'booked' : 'available',
        },
      });
    }

    return trip;
  }

  // 7. Trips for 2026-08-31 (Matches admin UI table exactly)
  // KLN-0630: sold 9/12 (status: Berangkat)
  const trip1 = await createTripWithSeats({
    tripCode: 'KLN-0630',
    routeId: routeJktBdg.id,
    vehicleId: vehicle1.id,
    driverId: driver1.id,
    departurePointId: pointBlokM.id,
    arrivalPointId: pointPasteur.id,
    departureDate: '2026-08-31',
    departureTime: '06:30',
    arrivalTime: '09:15',
    basePrice: 135000,
    label: 'Pagi',
    status: 'departed',
    occupiedSeats: [1, 2, 3, 4, 5, 6, 7, 8, 9], // 9 sold
  });

  // KLN-1000: sold 8/12 (status: Boarding)
  const trip2 = await createTripWithSeats({
    tripCode: 'KLN-1000',
    routeId: routeJktBdg.id,
    vehicleId: vehicle2.id,
    driverId: driver2.id,
    departurePointId: pointBlokM.id,
    arrivalPointId: pointPasteur.id,
    departureDate: '2026-08-31',
    departureTime: '10:00',
    arrivalTime: '12:45',
    basePrice: 145000,
    label: 'Favorit',
    status: 'boarding',
    occupiedSeats: [1, 2, 3, 4, 6, 7, 9, 10], // 8 sold
  });

  // KLN-1330: sold 12/12 (status: Penuh)
  const trip3 = await createTripWithSeats({
    tripCode: 'KLN-1330',
    routeId: routeBdgJkt.id,
    vehicleId: vehicle3.id,
    driverId: driver3.id,
    departurePointId: pointPasteur.id,
    arrivalPointId: pointBlokM.id,
    departureDate: '2026-08-31',
    departureTime: '13:30',
    arrivalTime: '16:15',
    basePrice: 155000,
    label: 'Siang',
    status: 'full',
    occupiedSeats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 12 sold (Full)
  });

  // KLN-1630: sold 3/12 (status: Terjadwal)
  const trip4 = await createTripWithSeats({
    tripCode: 'KLN-1630',
    routeId: routeJktBdg.id,
    vehicleId: vehicle4.id,
    driverId: driver4.id,
    departurePointId: pointBlokM.id,
    arrivalPointId: pointPasteur.id,
    departureDate: '2026-08-31',
    departureTime: '16:30',
    arrivalTime: '19:25',
    basePrice: 155000,
    label: 'Sore',
    status: 'scheduled',
    occupiedSeats: [1, 2, 4], // 3 sold
  });

  // 8. Trips for 2026-09-05 (Matches customer frontend search)
  await createTripWithSeats({
    tripCode: 'KLN-0905-0630',
    routeId: routeJktBdg.id,
    vehicleId: vehicle1.id,
    driverId: driver1.id,
    departurePointId: pointBlokM.id,
    arrivalPointId: pointPasteur.id,
    departureDate: '2026-09-05',
    departureTime: '06:30',
    arrivalTime: '09:15',
    basePrice: 135000,
    label: 'Pagi',
    status: 'scheduled',
    occupiedSeats: [2, 5, 8, 11, 12], // 7 seats left
  });

  await createTripWithSeats({
    tripCode: 'KLN-0905-1000',
    routeId: routeJktBdg.id,
    vehicleId: vehicle2.id,
    driverId: driver2.id,
    departurePointId: pointBlokM.id,
    arrivalPointId: pointPasteur.id,
    departureDate: '2026-09-05',
    departureTime: '10:00',
    arrivalTime: '12:45',
    basePrice: 145000,
    label: 'Favorit',
    status: 'scheduled',
    occupiedSeats: [1, 2, 3, 5, 7, 8, 11, 12], // 4 seats left
  });

  await createTripWithSeats({
    tripCode: 'KLN-0905-1630',
    routeId: routeJktBdg.id,
    vehicleId: vehicle4.id,
    driverId: driver4.id,
    departurePointId: pointBlokM.id,
    arrivalPointId: pointPasteur.id,
    departureDate: '2026-09-05',
    departureTime: '16:30',
    arrivalTime: '19:25',
    basePrice: 155000,
    label: 'Sore',
    status: 'scheduled',
    occupiedSeats: [2, 5, 8], // 9 seats left
  });

  console.log('✓ Seeded Trips & Seats for 2026-08-31 and 2026-09-05');

  // 9. Bookings (Matches admin table dummy data exactly)
  // Booking 1: KLN-0905-6A7 (Dimas Pratama, 10:00, seat 06, 145000, Lunas, DP)
  const seat06Trip2 = await prisma.tripSeat.findUnique({
    where: { tripId_seatNumber: { tripId: trip2.id, seatNumber: '06' } },
  });

  const b1 = await prisma.booking.create({
    data: {
      bookingCode: 'KLN-0905-6A7',
      tripId: trip2.id,
      customerName: 'Dimas Pratama',
      customerPhone: '0812-3456-7890',
      customerEmail: 'dimas@email.com',
      passengerCount: 1,
      totalAmount: 145000,
      paymentMethod: 'QRIS',
      paymentStatus: 'paid',
      bookingStatus: 'paid',
      avatar: 'DP',
      paidAt: new Date(Date.now() - 3600000),
    },
  });

  if (seat06Trip2) {
    await prisma.bookingSeat.create({
      data: {
        bookingId: b1.id,
        tripSeatId: seat06Trip2.id,
        seatNumber: '06',
        passengerName: 'Dimas Pratama',
        price: 145000,
      },
    });

    await prisma.manifest.create({
      data: {
        tripId: trip2.id,
        bookingId: b1.id,
        seatNumber: '06',
        passengerName: 'Dimas Pratama',
        passengerPhone: '0812-3456-7890',
        checkInStatus: 'checked_in',
        checkedInAt: new Date(),
        checkedInByUserId: rani.id,
      },
    });
  }

  // Booking 2: KLN-0905-9B2 (Sarah Amalia, 10:00, seat 09, 145000, Lunas, SA)
  const seat09Trip2 = await prisma.tripSeat.findUnique({
    where: { tripId_seatNumber: { tripId: trip2.id, seatNumber: '09' } },
  });

  const b2 = await prisma.booking.create({
    data: {
      bookingCode: 'KLN-0905-9B2',
      tripId: trip2.id,
      customerName: 'Sarah Amalia',
      customerPhone: '0813-9876-5432',
      customerEmail: 'sarah@email.com',
      passengerCount: 1,
      totalAmount: 145000,
      paymentMethod: 'QRIS',
      paymentStatus: 'paid',
      bookingStatus: 'paid',
      avatar: 'SA',
      paidAt: new Date(Date.now() - 120000),
    },
  });

  if (seat09Trip2) {
    await prisma.bookingSeat.create({
      data: {
        bookingId: b2.id,
        tripSeatId: seat09Trip2.id,
        seatNumber: '09',
        passengerName: 'Sarah Amalia',
        price: 145000,
      },
    });

    await prisma.manifest.create({
      data: {
        tripId: trip2.id,
        bookingId: b2.id,
        seatNumber: '09',
        passengerName: 'Sarah Amalia',
        passengerPhone: '0813-9876-5432',
        checkInStatus: 'pending',
      },
    });
  }

  // Booking 3: KLN-0905-3C8 (Raka Wibowo, 13:30, seat 03, 155000, Menunggu, RW)
  const seat03Trip3 = await prisma.tripSeat.findUnique({
    where: { tripId_seatNumber: { tripId: trip3.id, seatNumber: '03' } },
  });

  const b3 = await prisma.booking.create({
    data: {
      bookingCode: 'KLN-0905-3C8',
      tripId: trip3.id,
      customerName: 'Raka Wibowo',
      customerPhone: '0812-4455-6677',
      customerEmail: 'raka@email.com',
      passengerCount: 1,
      totalAmount: 155000,
      paymentMethod: 'QRIS',
      paymentStatus: 'unpaid',
      bookingStatus: 'waiting_payment',
      avatar: 'RW',
      heldExpiresAt: new Date(Date.now() + 8 * 60 * 1000),
    },
  });

  if (seat03Trip3) {
    await prisma.bookingSeat.create({
      data: {
        bookingId: b3.id,
        tripSeatId: seat03Trip3.id,
        seatNumber: '03',
        passengerName: 'Raka Wibowo',
        price: 155000,
      },
    });

    await prisma.manifest.create({
      data: {
        tripId: trip3.id,
        bookingId: b3.id,
        seatNumber: '03',
        passengerName: 'Raka Wibowo',
        passengerPhone: '0812-4455-6677',
        checkInStatus: 'pending',
      },
    });
  }

  // Booking 4: KLN-0905-1F4 (Nadia Putri, 16:30, seat 01, 155000, Lunas, NP)
  const seat01Trip4 = await prisma.tripSeat.findUnique({
    where: { tripId_seatNumber: { tripId: trip4.id, seatNumber: '01' } },
  });

  const b4 = await prisma.booking.create({
    data: {
      bookingCode: 'KLN-0905-1F4',
      tripId: trip4.id,
      customerName: 'Nadia Putri',
      customerPhone: '0815-6677-8899',
      customerEmail: 'nadia@email.com',
      passengerCount: 1,
      totalAmount: 155000,
      paymentMethod: 'QRIS',
      paymentStatus: 'paid',
      bookingStatus: 'paid',
      avatar: 'NP',
      paidAt: new Date(Date.now() - 720000),
    },
  });

  if (seat01Trip4) {
    await prisma.bookingSeat.create({
      data: {
        bookingId: b4.id,
        tripSeatId: seat01Trip4.id,
        seatNumber: '01',
        passengerName: 'Nadia Putri',
        price: 155000,
      },
    });

    await prisma.manifest.create({
      data: {
        tripId: trip4.id,
        bookingId: b4.id,
        seatNumber: '01',
        passengerName: 'Nadia Putri',
        passengerPhone: '0815-6677-8899',
        checkInStatus: 'pending',
      },
    });
  }

  // Booking 5: KLN-0905-8D1 (Fikri Maulana, 06:30, seat 08, 135000, Batal, FM)
  const seat08Trip1 = await prisma.tripSeat.findUnique({
    where: { tripId_seatNumber: { tripId: trip1.id, seatNumber: '08' } },
  });

  const b5 = await prisma.booking.create({
    data: {
      bookingCode: 'KLN-0905-8D1',
      tripId: trip1.id,
      customerName: 'Fikri Maulana',
      customerPhone: '0818-1234-9876',
      customerEmail: 'fikri@email.com',
      passengerCount: 1,
      totalAmount: 135000,
      paymentMethod: 'QRIS',
      paymentStatus: 'failed',
      bookingStatus: 'cancelled',
      avatar: 'FM',
      cancelledAt: new Date(Date.now() - 2460000),
      cancelReason: 'Customer requested cancellation',
    },
  });

  if (seat08Trip1) {
    await prisma.bookingSeat.create({
      data: {
        bookingId: b5.id,
        tripSeatId: seat08Trip1.id,
        seatNumber: '08',
        passengerName: 'Fikri Maulana',
        price: 135000,
      },
    });
  }

  console.log('✓ Seeded 5 Bookings (Lunas, Menunggu, Batal) matching UI');

  // 10. Activity Logs (Matches UI live updates)
  await prisma.activityLog.createMany({
    data: [
      {
        type: 'paid',
        title: 'Pembayaran diterima',
        description: 'KLN-0905-9B2 · Sarah Amalia',
        metadata: JSON.stringify({ bookingCode: 'KLN-0905-9B2', amount: 145000 }),
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
      },
      {
        type: 'booked',
        title: 'Pemesanan baru',
        description: 'KLN-0905-1F4 · Nadia Putri',
        metadata: JSON.stringify({ bookingCode: 'KLN-0905-1F4', amount: 155000 }),
        createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 mins ago
      },
      {
        type: 'alert',
        title: 'Kursi hampir penuh',
        description: 'Bandung → Jakarta · 13:30',
        metadata: JSON.stringify({ route: 'Bandung → Jakarta', time: '13:30' }),
        createdAt: new Date(Date.now() - 24 * 60 * 1000), // 24 mins ago
      },
      {
        type: 'cancel',
        title: 'Pemesanan dibatalkan',
        description: 'KLN-0905-8D1 · Fikri Maulana',
        metadata: JSON.stringify({ bookingCode: 'KLN-0905-8D1', reason: 'Customer cancellation' }),
        createdAt: new Date(Date.now() - 41 * 60 * 1000), // 41 mins ago
      },
    ],
  });

  console.log('✓ Seeded Activity Logs matching UI panel');
  console.log('\n🎉 Kelana Nova Database successfully seeded!');
}

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
