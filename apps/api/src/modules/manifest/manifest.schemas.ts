import { z } from 'zod';

export const updateManifestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid manifest ID'),
  }),
  body: z.object({
    checkInStatus: z.enum(['pending', 'checked_in', 'no_show']),
    notes: z.string().optional(),
  }),
});
