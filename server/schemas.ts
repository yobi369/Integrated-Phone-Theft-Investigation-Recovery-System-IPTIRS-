import { z } from 'zod';

export const organizationIdSchema = z.string().uuid();

export const createCaseSchema = z.object({
  category: z.enum(['phone_theft', 'device_loss', 'institutional_asset_loss']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  summary: z.string().trim().min(10).max(4000)
}).strict();

export const listCasesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
