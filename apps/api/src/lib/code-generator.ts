import crypto from 'crypto';

/**
 * Generate Kelana Booking Code format: KLN-MMDD-XXX
 * Example: KLN-0905-6A7
 */
export const generateBookingCode = (dateStr?: string, seatNumber?: string): string => {
  let datePart = '0905';
  if (dateStr) {
    // Expected format: YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      datePart = `${parts[1]}${parts[2]}`;
    }
  } else {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    datePart = `${mm}${dd}`;
  }

  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const seatPrefix = seatNumber ? seatNumber.replace(/^0+/, '') : '';
  const suffix = seatPrefix ? `${seatPrefix}${randomHex.slice(1)}` : randomHex;

  return `KLN-${datePart}-${suffix}`;
};

/**
 * Generate initials for avatar (e.g., "Dimas Pratama" -> "DP")
 */
export const getInitials = (name: string): string => {
  if (!name) return 'AT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
