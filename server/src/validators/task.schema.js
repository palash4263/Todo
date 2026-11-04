const { z } = require('zod');
const { PRIORITIES, STATUSES } = require('../models/Task');
const { isValidDate, isMonday } = require('../utils/week');

const isoDateTime = (name) =>
  z
    .string({ required_error: `${name} is required`, invalid_type_error: `${name} must be a string` })
    .datetime({ offset: true, message: `${name} must be an ISO 8601 date-time, e.g. 2026-11-05T12:30:00.000Z` })
    .transform((s) => new Date(s));

const taskFields = {
  title: z
    .string({ required_error: 'title is required', invalid_type_error: 'title must be a string' })
    .trim()
    .min(1, 'title is required')
    .max(120, 'title must be at most 120 characters'),
  description: z.string().trim().max(1000, 'description must be at most 1000 characters').optional(),
  dueAt: isoDateTime('dueAt'),
  endAt: z.union([z.null(), isoDateTime('endAt')]).optional(),
  priority: z.enum(PRIORITIES, { message: `priority must be one of: ${PRIORITIES.join(', ')}` }).optional(),
  status: z.enum(STATUSES, { message: `status must be one of: ${STATUSES.join(', ')}` }).optional(),
};

const createTaskSchema = z.object(taskFields).strict();

const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });

const statusSchema = z
  .object({ status: z.enum(STATUSES, { message: `status must be one of: ${STATUSES.join(', ')}` }) })
  .strict();

const weekStartParam = z
  .string()
  .refine(isValidDate, 'weekStart must be a date in YYYY-MM-DD format')
  .refine(isMonday, 'weekStart must be a Monday');

const listQuerySchema = z.object({
  q: z.string().trim().max(100, 'q must be at most 100 characters').optional(),
  weekStart: weekStartParam.optional(),
  status: z.enum(STATUSES).optional(),
  tz: z.string().max(64).optional(),
});

const weeksQuerySchema = z.object({
  weekStart: weekStartParam.optional(),
  tz: z.string().max(64).optional(),
});

module.exports = { createTaskSchema, updateTaskSchema, statusSchema, listQuerySchema, weeksQuerySchema };
