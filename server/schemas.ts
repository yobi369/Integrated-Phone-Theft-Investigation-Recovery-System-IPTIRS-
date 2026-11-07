import { z } from 'zod';

export const organizationIdSchema = z.string().uuid();
export const caseIdSchema = z.string().uuid();
export const assignmentIdSchema = z.string().uuid();

export const createCaseSchema = z.object({
  category: z.enum(['phone_theft', 'device_loss', 'institutional_asset_loss']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  summary: z.string().trim().min(10).max(4000)
}).strict();

export const listCasesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum([
    'submitted', 'under_review', 'accepted', 'in_progress',
    'pending_external_response', 'recovered', 'closed', 'rejected'
  ]).optional()
}).strict();

export const updateCaseStatusSchema = z.object({
  status: z.enum([
    'under_review', 'accepted', 'in_progress',
    'pending_external_response', 'recovered', 'closed', 'rejected'
  ]),
  reason: z.string().trim().min(10).max(1000)
}).strict();

export const createCaseAssignmentSchema = z.object({
  assigneeUserId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500)
}).strict();

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;
export type CreateCaseAssignmentInput = z.infer<typeof createCaseAssignmentSchema>;
