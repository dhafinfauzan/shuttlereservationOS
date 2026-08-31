import { PassengerData, SearchQuery, Trip } from '@/types/trip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error?: { code: string; message: string; details?: unknown }
}

export class ApiError extends Error {
  code: string

  constructor(message: string, code = 'API_ERROR') {
    super(message)
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const payload = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || !payload.success) {
    throw new ApiError(payload.error?.message || 'Layanan Kelana sedang bermasalah', payload.error?.code)
  }
  return payload.data
}

interface ScheduleDto {
  id: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  label?: string
  seats: number
  capacity: number
  timezone: 'WIB' | 'WITA' | 'WIT'
  departurePoint: string
  arrivalPoint: string
  isAvailable: boolean
}

interface SeatMapDto {
  unavailable: number[]
}

export interface BookingResult {
  bookingCode: string
  accessToken: string
  heldExpiresAt: string
  totalAmount: number
  seatNumbers: string[]
}

export async function searchSchedules(query: SearchQuery): Promise<Trip[]> {
  const params = new URLSearchParams({
    from: query.from,
    to: query.to,
    date: query.date,
    passengers: String(query.passengers),
  })
  const schedules = await request<ScheduleDto[]>(`/public/schedules?${params}`)
  return schedules.map((trip) => ({
    id: trip.id,
    from: trip.from,
    to: trip.to,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    duration: trip.duration,
    price: trip.price,
    label: trip.label,
    availableSeats: trip.seats,
    totalSeats: trip.capacity,
    occupiedSeats: [],
    timeZone: trip.timezone,
    departurePoint: trip.departurePoint,
    arrivalPoint: trip.arrivalPoint,
    isAvailable: trip.isAvailable,
    amenities: ['Executive Seat', 'USB Fast Charging', 'Air Mineral', 'Full AC'],
  }))
}

export async function loadSeatMap(trip: Trip): Promise<Trip> {
  const seatMap = await request<SeatMapDto>(`/public/schedules/${trip.id}/seats`)
  return { ...trip, occupiedSeats: seatMap.unavailable }
}

export function createBooking(
  tripId: string,
  seats: number[],
  passenger: PassengerData
): Promise<BookingResult> {
  return request<BookingResult>('/public/bookings', {
    method: 'POST',
    body: JSON.stringify({
      tripId,
      customerName: passenger.fullName,
      customerPhone: passenger.whatsapp,
      customerEmail: passenger.email,
      seatNumbers: seats,
      passengerCount: seats.length,
    }),
  })
}

export function simulatePayment(booking: BookingResult): Promise<{ status: string }> {
  return request(`/public/bookings/${encodeURIComponent(booking.bookingCode)}/simulate-payment`, {
    method: 'POST',
    headers: { 'x-booking-token': booking.accessToken },
  })
}
