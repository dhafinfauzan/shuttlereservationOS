export type TimeZone = 'WIB' | 'WITA' | 'WIT'

export type BookingStatus =
  | 'draft'
  | 'seat_held'
  | 'waiting_payment'
  | 'paid'
  | 'expired'
  | 'cancelled'

export type BookingStep = 1 | 2 | 3 | 4

export interface Trip {
  id: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  label?: 'Pagi' | 'Favorit' | 'Sore' | 'Malam' | 'Tercepat' | string
  availableSeats: number
  totalSeats: number
  occupiedSeats: number[]
  timeZone: TimeZone
  departurePoint: string
  arrivalPoint: string
  amenities?: string[]
  isAvailable?: boolean
}

export interface SearchQuery {
  from: string
  to: string
  date: string
  passengers: number
}

export interface PassengerData {
  fullName: string
  whatsapp: string
  email: string
}

export interface BookingState {
  trip: Trip | null
  seat: number | null
  passenger: PassengerData
  status: BookingStatus
  step: BookingStep
  heldUntil: number | null // timestamp ms
  bookingCode: string | null
}
