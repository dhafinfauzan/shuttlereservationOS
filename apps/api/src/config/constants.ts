export const ROLES = {
  OWNER: 'owner',
  ADMIN_CS: 'admin_cs',
  DRIVER: 'driver',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const BOOKING_STATUS = {
  DRAFT: 'draft',
  SEAT_HELD: 'seat_held',
  WAITING_PAYMENT: 'waiting_payment',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type BookingStatusType = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export type PaymentStatusType = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const SEAT_STATUS = {
  AVAILABLE: 'available',
  HELD: 'held',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
} as const;

export type SeatStatusType = typeof SEAT_STATUS[keyof typeof SEAT_STATUS];

export const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  BOARDING: 'boarding',
  DEPARTED: 'departed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FULL: 'full',
} as const;

export type TripStatusType = typeof TRIP_STATUS[keyof typeof TRIP_STATUS];

export const CHECKIN_STATUS = {
  PENDING: 'pending',
  CHECKED_IN: 'checked_in',
  NO_SHOW: 'no_show',
} as const;

export type CheckInStatusType = typeof CHECKIN_STATUS[keyof typeof CHECKIN_STATUS];

export const ACTIVITY_TYPE = {
  PAID: 'paid',
  BOOKED: 'booked',
  ALERT: 'alert',
  CANCEL: 'cancel',
  CHECKIN: 'checkin',
  TRIP_UPDATE: 'trip_update',
  GENERAL: 'general',
} as const;

export type ActivityType = typeof ACTIVITY_TYPE[keyof typeof ACTIVITY_TYPE];
