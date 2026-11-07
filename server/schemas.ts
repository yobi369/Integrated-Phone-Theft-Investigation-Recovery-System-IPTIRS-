import { z } from 'zod';

export const organizationIdSchema = z.string().uuid();
export const caseIdSchema = z.string().uuid();
export const assignmentIdSchema = z.string().uuid();
export const authorizationIdSchema = z.string().uuid();

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

const authorizationScopeSchema = z.record(z.string(), z.unknown()).refine(
  (scope) => JSON.stringify(scope).length <= 8000,
  'Authorization scope must not exceed 8 KB.'
);

export const createAuthorizationSchema = z.object({
  purpose: z.string().trim().min(10).max(1000),
  requestedAction: z.enum(['operator_status_check', 'operator_data_request', 'other_approved_process']),
  legalAuthorityReference: z.string().trim().min(3).max(240),
  scope: authorizationScopeSchema,
  validUntil: z.string().datetime({ offset: true })
}).strict();

export const decideAuthorizationSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().min(10).max(1000)
}).strict();

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;
export type CreateCaseAssignmentInput = z.infer<typeof createCaseAssignmentSchema>;
export type CreateAuthorizationInput = z.infer<typeof createAuthorizationSchema>;
export type DecideAuthorizationInput = z.infer<typeof decideAuthorizationSchema>;
