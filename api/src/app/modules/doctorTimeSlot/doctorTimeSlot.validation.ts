import { Day } from '@prisma/client';
import moment from 'moment';
import { z } from 'zod';

const timeValue = z.string()
    .trim()
    .refine((value) => moment(value, ['HH:mm', 'h:mm A'], true).isValid(), 'Time must use HH:mm format');

const intervalFields = z.object({
    startTime: timeValue,
    endTime: timeValue,
}).strict();

const validInterval = (interval: { startTime: string; endTime: string }) => {
    const start = moment(interval.startTime, ['HH:mm', 'h:mm A'], true);
    const end = moment(interval.endTime, ['HH:mm', 'h:mm A'], true);
    return end.isAfter(start);
};

const scheduleIntervalSchema = intervalFields.refine(validInterval, {
    message: 'End time must be later than start time',
    path: ['endTime'],
});

export const intervalsDoNotOverlap = (intervals: Array<{ startTime: string; endTime: string }>) => {
    const sorted = intervals
        .map((interval) => ({
            start: moment(interval.startTime, ['HH:mm', 'h:mm A'], true).valueOf(),
            end: moment(interval.endTime, ['HH:mm', 'h:mm A'], true).valueOf(),
        }))
        .sort((left, right) => left.start - right.start);
    return sorted.every((interval, index) => index === 0 || sorted[index - 1].end <= interval.start);
};

const timeSlotSchema = z.array(scheduleIntervalSchema)
    .min(1, 'At least one time interval is required')
    .max(48, 'A day cannot have more than 48 time intervals')
    .refine(intervalsDoNotOverlap, 'Time intervals cannot overlap');

export const createTimeSlotSchema = z.object({
    day: z.nativeEnum(Day),
    timeSlot: timeSlotSchema,
    weekDay: z.string().trim().max(20).optional(),
    maximumPatient: z.number().int().positive().max(1000).optional(),
}).strict();

const createIntervalSchema = intervalFields.extend({
    day: z.nativeEnum(Day),
}).strip().refine(validInterval, { message: 'End time must be later than start time', path: ['endTime'] });

const updateIntervalSchema = intervalFields.extend({
    id: z.number().int().positive(),
}).strip().refine(validInterval, { message: 'End time must be later than start time', path: ['endTime'] });

export const updateTimeSlotSchema = z.object({
    create: z.array(createIntervalSchema).max(48).optional(),
    timeSlot: z.array(updateIntervalSchema).max(48).optional(),
}).strict().refine((payload) =>
    Boolean(payload.create?.length || payload.timeSlot?.length),
{ message: 'Provide at least one interval to create or update' })
    .refine((payload) => {
        const grouped = new Map<Day, Array<{ startTime: string; endTime: string }>>();
        payload.create?.forEach(({ day, startTime, endTime }) => {
            const intervals = grouped.get(day) || [];
            intervals.push({ startTime, endTime });
            grouped.set(day, intervals);
        });
        return [...grouped.values()].every(intervalsDoNotOverlap);
    }, { message: 'Time intervals for the same day cannot overlap', path: ['create'] })
    .refine((payload) => {
        const ids = payload.timeSlot?.map(({ id }) => id) || [];
        return new Set(ids).size === ids.length;
    }, { message: 'Each availability interval can only be updated once', path: ['timeSlot'] });

export const dayFilterSchema = z.object({
    day: z.nativeEnum(Day).optional(),
    date: z.string().optional(),
}).strict();

export const doctorUnavailabilitySchema = z.object({
    date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string().trim().optional().nullable(),
    endTime: z.string().trim().optional().nullable(),
    isFullDay: z.boolean().optional(),
    reason: z.string().trim().min(1, 'Reason is required'),
    title: z.string().trim().max(200).optional().nullable(),
}).strict();
