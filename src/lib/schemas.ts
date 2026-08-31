import { z } from 'zod'

export const searchQuerySchema = z.object({
  from: z.string().min(1, 'Kota asal wajib dipilih'),
  to: z.string().min(1, 'Kota tujuan wajib dipilih'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  passengers: z.coerce.number().int().min(1, 'Minimal 1 penumpang').max(10, 'Maksimal 10 penumpang'),
})

export type SearchQuerySchemaType = z.infer<typeof searchQuerySchema>

export const passengerFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(80, 'Nama terlalu panjang'),
  whatsapp: z
    .string()
    .trim()
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
      'Nomor WhatsApp tidak valid (contoh: 081234567890)'
    ),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid (contoh: nama@email.com)'),
})

export type PassengerFormSchemaType = z.infer<typeof passengerFormSchema>

export const bookingStatusSchema = z.enum([
  'draft',
  'seat_held',
  'waiting_payment',
  'paid',
  'expired',
  'cancelled',
])
