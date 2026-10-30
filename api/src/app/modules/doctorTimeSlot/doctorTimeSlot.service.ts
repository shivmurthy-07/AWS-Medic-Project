import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../shared/prisma";
import { DoctorTimeSlot, ScheduleDay } from "@prisma/client";
import moment from "moment";
import { uuidSchema, validatePayload } from "../../../helpers/validation";
import {
    createTimeSlotSchema,
    dayFilterSchema,
    doctorUnavailabilitySchema,
    intervalsDoNotOverlap,
    updateTimeSlotSchema,
} from "./doctorTimeSlot.validation";

const createTimeSlot = async (user: any, payload: unknown): Promise<DoctorTimeSlot | null> => {
    const validatedPayload = validatePayload(createTimeSlotSchema, payload);
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }

    const result = await prisma.$transaction(async (tx) => {
        const isAlreadyExist = await tx.doctorTimeSlot.findFirst({
            where:{
                doctorId: isDoctor.id,
                day: validatedPayload.day
            }
        })
        if(isAlreadyExist){
            throw new ApiError(httpStatus.CONFLICT, 'Time Slot Already Exists. Please update it or choose another day.');
        }

        const createTimeSlot = await tx.doctorTimeSlot.create({
            data: {
                day: validatedPayload.day,
                doctorId: isDoctor.id,
                maximumPatient: validatedPayload.maximumPatient,
                weekDay: validatedPayload.weekDay,
                timeSlot: {
                    create: validatedPayload.timeSlot.map((item) => ({
                        startTime: item.startTime,
                        endTime: item.endTime
                    }))
                }
            }
        });

        return createTimeSlot;
    })
    // const tx = await prisma.$transaction(async() =>())

    // const result = await prisma.doctorTimeSlot.create({
    //     data: {
    //         day: payload.day,
    //         doctorId: isDoctor.id,
    //         maximumPatient: payload.maximumPatient,
    //         weekDay: payload.weekDay,
    //         timeSlot: {
    //             create: payload.timeSlot.map((item: any) => ({
    //                 startTime: item.startTime,
    //                 endTime: item.endTime
    //             }))
    //         }
    //     }
    // })
    return result;
}

const deleteTimeSlot = async (user: any, id: string): Promise<DoctorTimeSlot> => {
    const validatedId = validatePayload(uuidSchema, id);
    const timeSlot = await prisma.doctorTimeSlot.findFirst({
        where: { id: validatedId, doctorId: user.userId }
    });
    if (!timeSlot) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Availability was not found for this doctor.');
    }
    return prisma.$transaction(async (tx) => {
        await tx.scheduleDay.deleteMany({ where: { doctorTimeSlotId: validatedId } });
        return tx.doctorTimeSlot.delete({ where: { id: validatedId } });
    });
}

const getTimeSlot = async (user: any, id: string): Promise<DoctorTimeSlot | null> => {
    const validatedId = validatePayload(uuidSchema, id);
    const result = await prisma.doctorTimeSlot.findFirst({
        where: {
            id: validatedId,
            doctorId: user.userId
        }
    })
    return result;
}

const getMyTimeSlot = async (user: any, filter: unknown): Promise<DoctorTimeSlot[] | null> => {
    const validatedFilter = validatePayload(dayFilterSchema, filter);
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    let andCondition: any = { doctorId: isDoctor.id };
    if (validatedFilter.day) {
        andCondition.day = validatedFilter.day
    }

    const whereCondition = andCondition ? andCondition : {}
    const result = await prisma.doctorTimeSlot.findMany({
        where: whereCondition,
        include: {
            timeSlot: true
        }
    })
    return result;
}

const getAllTimeSlot = async (): Promise<DoctorTimeSlot[] | null> => {
    const result = await prisma.doctorTimeSlot.findMany({
        where: { doctor: { is: { approvalStatus: 'APPROVED' } } },
        include: {
            timeSlot: true,
            doctor: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    })
    return result;
}
const updateTimeSlot = async (user: any, payload: unknown): Promise<{ message: string }> => {
    const validatedPayload = validatePayload(updateTimeSlotSchema, payload);
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const { timeSlot, create } = validatedPayload;
    await prisma.$transaction(async (tx) => {
        const existingSchedules = await tx.scheduleDay.findMany({
            where: { doctorTimeSlot: { is: { doctorId: isDoctor.id } } },
            include: { doctorTimeSlot: { select: { day: true } } },
        });
        const intervalsByDay = new Map<NonNullable<DoctorTimeSlot['day']>, Array<{
            id?: number;
            startTime: string;
            endTime: string;
        }>>();
        for (const schedule of existingSchedules) {
            const day = schedule.doctorTimeSlot?.day;
            if (day) {
                const intervals = intervalsByDay.get(day) || [];
                intervals.push({ id: schedule.id, startTime: schedule.startTime, endTime: schedule.endTime });
                intervalsByDay.set(day, intervals);
            }
        }

        if (timeSlot?.length) {
            for (const item of timeSlot) {
                const existing = existingSchedules.find((schedule) => schedule.id === item.id);
                if (!existing) {
                    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to update this availability.');
                }
                const day = existing.doctorTimeSlot?.day;
                if (!day) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Availability is missing its weekday.');
                }
                const intervals = intervalsByDay.get(day) || [];
                const interval = intervals.find((candidate) => candidate.id === item.id);
                if (!interval) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Availability interval could not be validated.');
                }
                interval.startTime = item.startTime;
                interval.endTime = item.endTime;
            }
        }

        let doctorTimeSlot: { id: string; day: DoctorTimeSlot['day'] } | null = null;
        if (create?.length) {
            doctorTimeSlot = await tx.doctorTimeSlot.findFirst({
                where: { day: create[0].day, doctorId: isDoctor.id },
                select: { id: true, day: true },
            });
            if (!doctorTimeSlot) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Time Slot is not found !!');
            }
            if (create.some((item) => item.day !== doctorTimeSlot?.day)) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'All added times must belong to the selected day.');
            }
            const intervals = intervalsByDay.get(create[0].day) || [];
            intervals.push(...create.map(({ startTime, endTime }) => ({ startTime, endTime })));
            intervalsByDay.set(create[0].day, intervals);
        }

        for (const intervals of intervalsByDay.values()) {
            if (!intervalsDoNotOverlap(intervals)) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Time intervals for the same day cannot overlap.');
            }
        }

        if (create?.length && doctorTimeSlot) {
            await Promise.all(create.map((item) =>
                tx.scheduleDay.create({
                    data: {
                        startTime: item.startTime,
                        endTime: item.endTime,
                        doctorTimeSlotId: doctorTimeSlot.id,
                    },
                })
            ));
        }
        if (timeSlot?.length) {
            await Promise.all(timeSlot.map((item) =>
                tx.scheduleDay.update({
                    where: { id: item.id },
                    data: { startTime: item.startTime, endTime: item.endTime },
                })
            ));
        }
    });
    return {
        message: 'Successfully Updated'
    }
}

const createUnavailability = async (user: any, payload: unknown) => {
    const validated = validatePayload(doctorUnavailabilitySchema, payload);
    const { userId } = user;

    const result = await prisma.doctorUnavailability.create({
        data: {
            doctorId: userId,
            date: validated.date,
            startTime: validated.startTime || null,
            endTime: validated.endTime || null,
            isFullDay: validated.isFullDay || false,
            reason: validated.reason,
            title: validated.title || null,
        }
    });

    return result;
};

const getDoctorUnavailability = async (user: any) => {
    const { userId } = user;
    const result = await prisma.doctorUnavailability.findMany({
        where: {
            doctorId: userId
        },
        orderBy: {
            date: 'asc'
        }
    });
    return result;
};

const deleteDoctorUnavailability = async (user: any, id: string) => {
    const validatedId = validatePayload(uuidSchema, id);
    const existing = await prisma.doctorUnavailability.findUnique({
        where: { id: validatedId }
    });

    if (!existing || existing.doctorId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this block');
    }

    const result = await prisma.doctorUnavailability.delete({
        where: { id: validatedId }
    });
    return result;
};

const getAppointmentTimeOfEachDoctor = async (id: string, filter: unknown): Promise<any> => {
    const validatedId = validatePayload(uuidSchema, id);
    const validatedFilter = validatePayload(dayFilterSchema, filter);

    let targetDay = validatedFilter.day;
    let targetDate = validatedFilter.date;

    if (!targetDay && targetDate) {
        targetDay = moment(targetDate).format('dddd').toLowerCase() as any;
    }

    const doctorTimSlot = await prisma.doctorTimeSlot.findMany({
        where: {
            doctorId: validatedId,
            doctor: { is: { approvalStatus: 'APPROVED' } },
        },
        include: {
            timeSlot: true
        },
    });

    // Fetch unavailabilities (leaves, surgeries, meetings, seminars, etc.) for this doctor
    const unavailabilities = targetDate
        ? await prisma.doctorUnavailability.findMany({
            where: {
                doctorId: validatedId,
                date: moment(targetDate).format('YYYY-MM-DD'),
            }
        })
        : [];

    // Fetch existing appointments on this date to know which slots are already booked
    const bookedAppointments = targetDate
        ? await prisma.appointments.findMany({
            where: {
                doctorId: validatedId,
                scheduleDate: {
                    startsWith: moment(targetDate).format('YYYY-MM-DD'),
                },
                OR: [
                    { status: null },
                    { status: { notIn: ['cancel', 'canceled', 'Canceled'] } }
                ]
            },
            select: {
                scheduleTime: true,
            }
        })
        : [];

    const bookedTimeStrings = new Set(
        bookedAppointments.map(a => (a.scheduleTime || '').trim().toLowerCase())
    );

    const allSlots = doctorTimSlot.map((item) => {
        const { day, timeSlot } = item;
        return { day, timeSlot };
    });

    const generateTimeSlot = (timeSlot: any) => {
        const selectedTime: any[] = [];
        timeSlot.forEach((item: any) => {
            const interval = 30;
            const newTimeSlots: any[] = [];
            const day: string = item?.day;

            item?.timeSlot.map((slot: ScheduleDay) => {
                const { startTime, endTime } = slot;
                const startDate = moment(startTime, ['HH:mm', 'h:mm A', 'hh:mm a'], true);
                const endDate = moment(endTime, ['HH:mm', 'h:mm A', 'hh:mm a'], true);

                while (startDate.isValid() && endDate.isValid() && startDate.isBefore(endDate)) {
                    const timeString = startDate.format('hh:mm a');
                    const slotStart = startDate.clone();
                    const slotEnd = startDate.clone().add(interval, 'minutes');

                    let isBlocked = false;
                    let blockReason = '';
                    let blockTitle = '';

                    for (const unavail of unavailabilities) {
                        if (unavail.isFullDay) {
                            isBlocked = true;
                            blockReason = unavail.reason;
                            blockTitle = unavail.title || '';
                            break;
                        }
                        if (unavail.startTime && unavail.endTime) {
                            const uStart = moment(unavail.startTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
                            const uEnd = moment(unavail.endTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
                            if (slotStart.isBefore(uEnd) && slotEnd.isAfter(uStart)) {
                                isBlocked = true;
                                blockReason = unavail.reason;
                                blockTitle = unavail.title || '';
                                break;
                            }
                        }
                    }

                    const isBooked = bookedTimeStrings.has(timeString.toLowerCase());
                    const isAvailable = !isBlocked && !isBooked;

                    const selectableTime = {
                        id: newTimeSlots.length + 1,
                        time: timeString,
                        isAvailable,
                        isBlocked,
                        blockReason,
                        blockTitle,
                        isBooked
                    };

                    newTimeSlots.push({ day: day, slot: selectableTime });
                    startDate.add(interval, 'minutes');
                }
            });

            const newTime = targetDay
                ? newTimeSlots.filter((slot) => slot.day === targetDay)
                : newTimeSlots;
            selectedTime.push(newTime);
        });
        return selectedTime.flat();
    };

    const result = generateTimeSlot(allSlots);
    if (result.length > 0) {
        return result;
    }

    // Default standard clinical slots when doctor has not created custom timeslots
    const defaultClinicTimes = [
        "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
        "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"
    ];

    const fallbackSlots = defaultClinicTimes.map((timeString, idx) => {
        const slotStart = moment(timeString, ['hh:mm A', 'h:mm A']);
        const slotEnd = slotStart.clone().add(30, 'minutes');

        let isBlocked = false;
        let blockReason = '';
        let blockTitle = '';

        for (const unavail of unavailabilities) {
            if (unavail.isFullDay) {
                isBlocked = true;
                blockReason = unavail.reason;
                blockTitle = unavail.title || '';
                break;
            }
            if (unavail.startTime && unavail.endTime) {
                const uStart = moment(unavail.startTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
                const uEnd = moment(unavail.endTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
                if (slotStart.isBefore(uEnd) && slotEnd.isAfter(uStart)) {
                    isBlocked = true;
                    blockReason = unavail.reason;
                    blockTitle = unavail.title || '';
                    break;
                }
            }
        }

        const isBooked = bookedTimeStrings.has(timeString.toLowerCase());
        const isAvailable = !isBlocked && !isBooked;

        return {
            day: targetDay || 'all',
            slot: {
                id: idx + 1,
                time: timeString,
                isAvailable,
                isBlocked,
                blockReason,
                blockTitle,
                isBooked
            }
        };
    });

    return fallbackSlots;
};

export const TimeSlotService = {
    updateTimeSlot,
    getAllTimeSlot,
    getTimeSlot,
    createTimeSlot,
    deleteTimeSlot,
    getMyTimeSlot,
    getAppointmentTimeOfEachDoctor,
    createUnavailability,
    getDoctorUnavailability,
    deleteDoctorUnavailability
};