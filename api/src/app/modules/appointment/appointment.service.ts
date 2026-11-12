import { Appointments, Day, Patient, Payment, Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import moment from 'moment';
import { randomUUID } from 'crypto';
import { EmailtTransporter } from "../../../helpers/emailTransporter";
import * as path from 'path';
import config from "../../../config";
import { validatePayload, uuidSchema } from "../../../helpers/validation";
import { resolveRegisteredPatientId } from "../../../helpers/patientResolver";
import { FeeService } from "../fee/fee.service";
import { sanitizeReportRecord } from "../medicalReport/medicalReport.service";
import {
    appointmentAdminUpdateSchema,
    appointmentCreateSchema,
    appointmentDoctorListQuerySchema,
    appointmentDoctorUpdateSchema,
    appointmentDoctorUpdateWithIdSchema,
    appointmentPatientUpdateSchema,
    appointmentTrackingSchema,
} from "./appointment.validation";

// Generate one canonical UUID so appointment.id and appointment.trackingId always match
const createUnifiedAppointmentId = () => randomUUID();

const APPOINTMENT_REPORT_INCLUDE = {
    include: {
        doctor: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                specialization: true,
                designation: true,
                registration: true,
                hospitalName: true,
                clinicName: true,
            }
        },
        patient: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                mobile: true,
                gender: true,
                dateOfBirth: true,
                bloodGroup: true,
            }
        }
    }
};

const filterCompletedAppointmentReports = <T extends { status?: string | null; medicalReports?: any[] }>(apt: T): T => {
    const reports = apt?.status === 'Completed' && Array.isArray(apt.medicalReports)
        ? apt.medicalReports.map(sanitizeReportRecord)
        : [];
    return {
        ...apt,
        medicalReports: reports,
    };
};

const ensureAppointmentSlotAvailable = async (
    tx: Prisma.TransactionClient,
    doctorId: string,
    scheduleDate: string,
    scheduleTime: string,
) => {
    const appointmentDate = moment(scheduleDate, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD', moment.ISO_8601]);
    const day = appointmentDate.format('dddd').toLowerCase() as Day;
    const requestedStart = moment(scheduleTime, ['hh:mm a', 'h:mm a', 'HH:mm', 'h:mm A']);
    const requestedEnd = requestedStart.clone().add(30, 'minutes');
    const doctorSlots = await tx.doctorTimeSlot.findMany({
        where: { doctorId, day },
        include: { timeSlot: true },
    });

    let maxPatientPerSlot = 1;
    if (doctorSlots && doctorSlots.length > 0) {
        const matchingSlot = doctorSlots.find(({ timeSlot }) => timeSlot.some(({ startTime, endTime }) => {
            const intervalStart = moment(startTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
            const intervalEnd = moment(endTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
            return requestedStart.isSameOrAfter(intervalStart) && requestedEnd.isSameOrBefore(intervalEnd);
        }));

        if (!matchingSlot) {
            throw new ApiError(httpStatus.BAD_REQUEST, "The selected time is outside this doctor's availability.");
        }
        maxPatientPerSlot = matchingSlot.maximumPatient ?? 1;
    }

    const dateFormatted = appointmentDate.format('YYYY-MM-DD');
    const unavailabilityList = await tx.doctorUnavailability.findMany({
        where: { doctorId, date: dateFormatted },
    });
    for (const unavail of unavailabilityList) {
        if (unavail.isFullDay) {
            throw new ApiError(httpStatus.CONFLICT, `Doctor is unavailable on this date (${unavail.reason}${unavail.title ? `: ${unavail.title}` : ''}).`);
        }
        if (unavail.startTime && unavail.endTime) {
            const uStart = moment(unavail.startTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
            const uEnd = moment(unavail.endTime, ['HH:mm', 'h:mm A', 'hh:mm a']);
            if (requestedStart.isBefore(uEnd) && requestedEnd.isAfter(uStart)) {
                throw new ApiError(httpStatus.CONFLICT, `Doctor is unavailable at this slot due to ${unavail.reason}${unavail.title ? ` (${unavail.title})` : ''}.`);
            }
        }
    }

    const bookingCount = await tx.appointments.count({
        where: {
            doctorId,
            scheduleDate: {
                startsWith: dateFormatted,
            },
            scheduleTime,
            OR: [
                { status: null },
                { status: { notIn: ['cancel', 'canceled', 'Canceled', 'archived'] } },
            ],
        }
    });
    if (bookingCount >= maxPatientPerSlot) {
        throw new ApiError(httpStatus.CONFLICT, 'This appointment slot is no longer available.');
    }
};

const createAppointment = async (payload: any, user: any): Promise<Appointments | null | any> => {
    if (user?.role === 'doctor') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Doctors cannot book appointments. Appointment scheduling is accessible to patients only.');
    }

    const { patientInfo, payment } = validatePayload(appointmentCreateSchema, payload);
    if (!patientInfo.doctorId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Select a doctor for your appointment.');
    }
    const normalizedEmail = patientInfo.email ? String(patientInfo.email).trim().toLowerCase() : patientInfo.email;
    const explicitPatientId = user?.role === 'patient' ? user.userId : (patientInfo.patientId || null);
    const validPatientId = await resolveRegisteredPatientId({
        patientId: explicitPatientId,
        email: normalizedEmail,
        phone: patientInfo.phone,
    });

    const appointmentData = {
        ...patientInfo,
        email: normalizedEmail,
        doctorId: patientInfo.doctorId,
        patientId: validPatientId,
    };

    const isDoctorExist = await prisma.doctor.findUnique({
        where: {
            id: appointmentData.doctorId
        }
    });

    if (!isDoctorExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    if (isDoctorExist.approvalStatus !== 'APPROVED') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Appointments can only be booked with approved doctors.');
    }
    const result = await prisma.$transaction(async (tx) => {
        await ensureAppointmentSlotAvailable(
            tx,
            appointmentData.doctorId,
            appointmentData.scheduleDate,
            appointmentData.scheduleTime,
        );
        const isPaid = payment.paymentMethod !== 'cash';
        const initialPaymentStatus = isPaid ? 'paid' : 'unpaid';

        const consultationType = String((patientInfo as any).consultationType || 'First Consultation');
        const consultationMode = String((patientInfo as any).consultationMode || 'IN_PERSON');

        const feeCalc = await FeeService.calculateConsultationFee(
            appointmentData.doctorId as string,
            consultationType,
            consultationMode
        );

        const docFee = feeCalc.consultationFee;
        const bookingFee = feeCalc.bookingFee;
        const vat = feeCalc.vat;
        const totalAmount = feeCalc.totalAmount;

        const feeSnapshot = {
            serviceName: feeCalc.serviceName,
            mode: feeCalc.mode,
            feeSource: feeCalc.feeSource,
            consultationFee: docFee,
            bookingFee,
            vat,
            totalAmount,
            timestamp: new Date().toISOString()
        };

        const unifiedId = createUnifiedAppointmentId();
        const appointment = await tx.appointments.create({
            data: {
                ...appointmentData,
                id: unifiedId,
                consultationType: feeCalc.serviceName,
                consultationMode: feeCalc.mode,
                consultationFee: docFee,
                feeSnapshot: feeSnapshot as any,
                paymentStatus: initialPaymentStatus,
                trackingId: unifiedId
            },
            include: {
                doctor: true,
                patient: true,
            medicalReports: {
                include: {
                    doctor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            specialization: true,
                            designation: true,
                            registration: true,
                            hospitalName: true,
                            clinicName: true,
                        }
                    },
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobile: true,
                            gender: true,
                            dateOfBirth: true,
                            bloodGroup: true,
                        }
                    }
                }
            }
            }
        });
        const { paymentMethod, paymentType } = payment;
        if (appointment.id) {
            await tx.payment.create({
                data: {
                    appointmentId: appointment.id,
                    bookingFee: bookingFee,
                    paymentMethod: paymentMethod,
                    paymentType: paymentType,
                    vat: vat,
                    DoctorFee: docFee,
                    totalAmount: totalAmount,
                }
            })
        }
        const pathName = path.join(__dirname, '../../../../template/appointment.html')
        const appointmentObj = {
            created: moment(appointment.createdAt).format('LL'),
            trackingId: appointment.trackingId,
            patientType: appointment.patientType,
            status: appointment.status,
            paymentStatus: appointment.paymentStatus,
            prescriptionStatus: appointment.prescriptionStatus,
            scheduleDate:moment(appointment.scheduleDate).format('LL'),
            scheduleTime:appointment.scheduleTime,
            doctorImg: appointment?.doctor?.img,
            doctorFirstName: appointment?.doctor?.firstName,
            doctorLastName: appointment?.doctor?.lastName,
            specialization:appointment?.doctor?.specialization,
            designation:appointment?.doctor?.designation,
            college:appointment?.doctor?.college,
            patientImg:appointment?.patient?.img,
            patientfirstName:appointment?.patient?.firstName,
            patientLastName:appointment?.patient?.lastName,
            dateOfBirth: moment().diff(moment(appointment?.patient?.dateOfBirth), 'years'),
            bloodGroup:appointment?.patient?.bloodGroup,
            city:appointment?.patient?.city,
            state:appointment?.patient?.state,
            country:appointment?.patient?.country
        }
        const replacementObj = appointmentObj;
        const subject = `Appointment Confirm With Dr ${appointment?.doctor?.firstName + ' ' + appointment?.doctor?.lastName} at ${appointment.scheduleDate} + ' ' + ${appointment.scheduleTime}`
        const toMail = `${appointment.email + ',' + appointment.doctor?.email}`;
        EmailtTransporter({ pathName, replacementObj, toMail, subject }).catch((err) => {
            console.warn('Appointment email notification skipped:', err?.message || err);
        });
        return appointment;
    });
    return result;
}

const createAppointmentByUnAuthenticateUser = async (payload: any): Promise<Appointments | null> => {
    const validatedPayload = validatePayload(appointmentCreateSchema, payload);
    const { patientInfo, payment } = validatedPayload;
    const configuredDoctorId = patientInfo.doctorId || config.defaultAdminDoctor;
    if (!configuredDoctorId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Select an approved doctor for your appointment.');
    }
    const doctorIdForUnauth = validatePayload(uuidSchema, configuredDoctorId);
    const normalizedEmail = patientInfo.email ? String(patientInfo.email).trim().toLowerCase() : patientInfo.email;
    const resolvedPatientId = await resolveRegisteredPatientId({
        email: normalizedEmail,
        phone: patientInfo.phone,
    });
    const appointmentData = {
        ...patientInfo,
        email: normalizedEmail,
        doctorId: doctorIdForUnauth,
        patientId: resolvedPatientId,
    };

    const result = await prisma.$transaction(async (tx) => {
        const doctorForFee = await tx.doctor.findUnique({ where: { id: doctorIdForUnauth } });
        if (!doctorForFee) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!');
        }
        if (doctorForFee.approvalStatus !== 'APPROVED') {
            throw new ApiError(httpStatus.FORBIDDEN, 'Appointments can only be booked with approved doctors.');
        }
        const docFee = doctorForFee.price != null ? Number(doctorForFee.price) : 60;

        await ensureAppointmentSlotAvailable(
            tx,
            doctorIdForUnauth,
            appointmentData.scheduleDate,
            appointmentData.scheduleTime,
        );
        const isPaid = payment.paymentMethod !== 'cash';
        const initialPaymentStatus = isPaid ? 'paid' : 'unpaid';
        const unifiedId = createUnifiedAppointmentId();
        const appointment = await tx.appointments.create({
            data: {
                ...appointmentData,
                id: unifiedId,
                paymentStatus: initialPaymentStatus,
                trackingId: unifiedId
            },
        });
        const { paymentMethod, paymentType } = payment;
        const bookingFee = 10;
        const vat = Math.round((15 / 100) * (docFee + bookingFee));
        const totalAmount = docFee + bookingFee + vat;
        if (appointment.id) {
            await tx.payment.create({
                data: {
                    appointmentId: appointment.id,
                    bookingFee: bookingFee,
                    paymentMethod: paymentMethod,
                    paymentType: paymentType,
                    vat: vat,
                    DoctorFee: docFee,
                    totalAmount: totalAmount,
                }
            })
        }

        const appointmentObj = {
            created: moment(appointment.createdAt).format('LL'),
            trackingId: appointment.trackingId,
            patientType: appointment.patientType,
            status: appointment.status,
            paymentStatus: appointment.paymentStatus,
            prescriptionStatus: appointment.prescriptionStatus,
            scheduleDate:moment(appointment.scheduleDate).format('LL'),
            scheduleTime:appointment.scheduleTime,
        }
        const pathName = path.join(__dirname, '../../../../template/meeting.html')
        const replacementObj = appointmentObj;
        const subject = `Appointment Confirm at ${appointment.scheduleDate} ${appointment.scheduleTime}`

        const toMail = `${appointment.email}`;
        EmailtTransporter({ pathName, replacementObj, toMail, subject }).catch((err) => {
            console.warn('Appointment email notification skipped:', err?.message || err);
        });
        return appointment;
    })

    return result;
}

const getAllAppointments = async (): Promise<Appointments[] | null> => {
    const result = await prisma.appointments.findMany({
        include: {
            doctor: {
                select: { id: true, firstName: true, lastName: true, specialization: true }
            },
            patient: {
                select: { id: true, firstName: true, lastName: true }
            },
            payment: true
        }
    });
    return result;
}

const getAppointment = async (id: string, user: any) => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.appointments.findUnique({
        where: {
            id: id
        },
        include: {
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    img: true,
                    specialization: true,
                    designation: true,
                    college: true,
                    clinicName: true,
                    clinicAddress: true,
                    city: true,
                    state: true,
                    hospitalName: true,
                    hospitalAddress: true,
                }
            },
            patient: true,
            medicalReports: {
                include: {
                    doctor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            specialization: true,
                            designation: true,
                            registration: true,
                            hospitalName: true,
                            clinicName: true,
                        }
                    },
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobile: true,
                            gender: true,
                            dateOfBirth: true,
                            bloodGroup: true,
                        }
                    }
                }
            }
        }
    });
    if (!result) {
        return null;
    }
    if (!result.patientId && (result.email || result.phone)) {
        const resolvedId = await resolveRegisteredPatientId({
            email: result.email,
            phone: result.phone,
        });
        if (resolvedId) {
            const linkedPatient = await prisma.patient.findUnique({ where: { id: resolvedId } });
            await prisma.appointments.update({
                where: { id: result.id },
                data: { patientId: resolvedId },
            });
            (result as any).patientId = resolvedId;
            (result as any).patient = linkedPatient;
        }
    }
    if (
        user.role !== 'admin' &&
        (user.role === 'patient' ? result.patientId : result.doctorId) !== user.userId
    ) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to access this appointment.');
    }
    return filterCompletedAppointmentReports(result);
}

const getAppointmentConfirmation = async (id: string) => prisma.appointments.findUnique({
    where: { id: validatePayload(uuidSchema, id) },
    select: {
        id: true,
        trackingId: true,
        scheduleDate: true,
        scheduleTime: true,
        status: true,
        paymentStatus: true,
        payment: {
            select: {
                id: true,
                paymentMethod: true,
                paymentType: true,
            },
        },
        doctor: {
            select: {
                firstName: true,
                lastName: true,
                img: true,
                clinicName: true,
                clinicAddress: true,
                city: true,
                country: true,
                specialization: true
            }
        }
    }
});

const getAppointmentByTrackingId = async (data: any) => {
    const { id } = validatePayload(appointmentTrackingSchema, data);
    const rawTrimmed = typeof id === 'string' ? id.trim().replace(/^#/, '') : '';
    const normalizedTracking = rawTrimmed.toUpperCase();
    const normalizedLower = rawTrimmed.toLowerCase();

    const result = await prisma.appointments.findFirst({
        where: {
            OR: [
                { trackingId: rawTrimmed },
                { trackingId: normalizedTracking },
                { trackingId: normalizedLower },
                { id: rawTrimmed },
                { id: normalizedTracking },
                { id: normalizedLower },
            ],
        },
        select: {
            id: true,
            trackingId: true,
            scheduleDate: true,
            scheduleTime: true,
            status: true,
            paymentStatus: true,
            prescriptionStatus: true,
            isFollowUp: true,
            doctor: {
                select: {
                    firstName: true,
                    lastName: true,
                    designation: true,
                    college: true,
                    degree: true,
                    img: true,
                    clinicName: true,
                    clinicAddress: true,
                    city: true,
                    country: true
                },
            },
        }
    });
    return result;
}

const getPatientAppointmentById = async (user: any): Promise<Appointments[] | null> => {
    const { userId } = user;
    const isPatient = await prisma.patient.findUnique({
        where: {
            id: userId
        }
    })
    if (!isPatient) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient Account is not found !!')
    }
    if (isPatient.email) {
        await prisma.appointments.updateMany({
            where: {
                patientId: null,
                email: isPatient.email.trim().toLowerCase(),
            },
            data: {
                patientId: userId,
            },
        });
    }
    const result = await prisma.appointments.findMany({
        where: {
            patientId: userId
        },
        include: {
            doctor: true,
            medicalReports: APPOINTMENT_REPORT_INCLUDE
        }
    })
    return result.map(filterCompletedAppointmentReports);
}

const getPaymentInfoViaAppintmentId = async (id: string, user: any): Promise<any> => {
    id = validatePayload(uuidSchema, id);
    const appointment = await prisma.appointments.findUnique({
        where: { id },
        select: { patientId: true, doctorId: true }
    });
    if (
        !appointment ||
        (user.role !== 'admin' &&
            (user.role === 'patient' ? appointment.patientId : appointment.doctorId) !== user.userId)
    ) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to access this payment information.');
    }
    const result = await prisma.payment.findFirst({
        where: {
            appointmentId: id
        },
        include: {
            appointment: {
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true,
                            address: true,
                            country: true,
                            city: true
                        }
                    },
                    doctor: {
                        select: {
                            firstName: true,
                            lastName: true,
                            address: true,
                            country: true,
                            city: true
                        }
                    }
                }
            }
        }
    });
    return result;
}

const getPatientPaymentInfo = async (user: any): Promise<Payment[]> => {
    const { userId } = user;
    const isUserExist = await prisma.patient.findUnique({
        where: { id: userId }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient Account is not found !!')
    }
    const result = await prisma.payment.findMany({
        where: { appointment: { patientId: isUserExist.id } },
        include: {
            appointment: {
                include: {
                    doctor: {
                        select: {
                            firstName: true,
                            lastName: true,
                            designation: true
                        }
                    }
                }
            }
        }
    });
    return result;
}
const getDoctorInvoices = async (user: any): Promise<Payment[] | null> => {
    const { userId } = user;
    const isUserExist = await prisma.doctor.findUnique({
        where: { id: userId }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const result = await prisma.payment.findMany({
        where: { appointment: { doctorId: isUserExist.id } },
        include: {
            appointment: {
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        }
    });
    return result;
}

const deleteAppointment = async (id: string): Promise<any> => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.appointments.delete({
        where: {
            id: id
        }
    });
    return result;
}

const updateAppointment = async (id: string, payload: Partial<Appointments>, user: any): Promise<Appointments> => {
    id = validatePayload(uuidSchema, id);
    payload = user.role === 'admin'
        ? validatePayload(appointmentAdminUpdateSchema, payload)
        : user.role === 'doctor'
            ? validatePayload(appointmentDoctorUpdateSchema, payload)
            : validatePayload(appointmentPatientUpdateSchema, payload);
    const appointment = await prisma.appointments.findUnique({
        where: { id },
        select: { patientId: true, doctorId: true }
    });
    if (!appointment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Appointment was not found.');
    }
    if (
        user.role !== 'admin' &&
        (user.role === 'patient' ? appointment.patientId : appointment.doctorId) !== user.userId
    ) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to update this appointment.');
    }
    if (user.role === 'patient' && !['cancel', 'canceled'].includes(String(payload.status).toLowerCase())) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Patients may only cancel their own appointments.');
    }
    const data: any = user.role === 'admin'
        ? payload
        : user.role === 'doctor'
            ? {
                status: payload.status,
                prescriptionStatus: payload.prescriptionStatus,
                isFollowUp: payload.isFollowUp,
                patientType: payload.patientType,
                reasonForVisit: payload.reasonForVisit,
                description: payload.description,
                scheduleDate: payload.scheduleDate,
                scheduleTime: payload.scheduleTime
            }
            : { status: 'cancel' };
    const result = await prisma.appointments.update({
        data,
        where: {
            id: id
        }
    })
    return result;
}

//doctor Side
const getDoctorAppointmentsById = async (user: any, filter: any): Promise<Appointments[] | null> => {
    filter = validatePayload(appointmentDoctorListQuerySchema, filter);
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) { throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!') }

    let andCondition: any = { doctorId: userId };

    if (filter.sortBy == 'today') {
        const today = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const tomorrow = moment(today).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');

        andCondition.scheduleDate = {
            gte: today,
            lt: tomorrow
        }
    }
    if (filter.sortBy == 'upcoming') {
        const upcomingDate = moment().startOf('day').add(1, 'days').format('YYYY-MM-DD HH:mm:ss')
        andCondition.scheduleDate = {
            gte: upcomingDate
        }
    }
    const whereConditions = andCondition ? andCondition : {}

    const result = await prisma.appointments.findMany({
        where: whereConditions,
        include: {
            patient: true,
            medicalReports: APPOINTMENT_REPORT_INCLUDE,
            prescription: {
                select: {
                    id: true
                }
            }
        }
    });
    return result.map(filterCompletedAppointmentReports);
}

const getDoctorPatients = async (user: any): Promise<any[]> => {
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    });
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!');
    }

    // Strictly fetch appointments taken with this specific doctor only
    const doctorAppointments = await prisma.appointments.findMany({
        where: {
            doctorId: userId
        },
        orderBy: {
            scheduleDate: 'desc'
        },
        include: {
            patient: true,
            prescription: {
                select: {
                    id: true,
                    disease: true,
                    createdAt: true
                }
            },
            medicalReports: {
                select: {
                    id: true,
                    reportTitle: true,
                    reportType: true,
                    reportDate: true
                }
            }
        }
    });

    if (!doctorAppointments.length) {
        return [];
    }

    // Group strictly by patient who has taken an appointment with this specific doctor
    const patientMap = new Map<string, any>();

    for (const apt of doctorAppointments) {
        const patientKey = apt.patientId || (apt.email ? apt.email.trim().toLowerCase() : apt.id);

        if (!patientMap.has(patientKey)) {
            const basePatient = apt.patient;
            const patientRecord = {
                id: basePatient?.id || apt.patientId || apt.id,
                patientId: basePatient?.id || apt.patientId || null,
                firstName: basePatient?.firstName || apt.firstName || 'Patient',
                lastName: basePatient?.lastName || apt.lastName || '',
                email: basePatient?.email || apt.email || 'N/A',
                mobile: basePatient?.mobile || apt.phone || 'N/A',
                address: basePatient?.address || apt.address || 'N/A',
                city: basePatient?.city || '',
                state: basePatient?.state || '',
                country: basePatient?.country || 'India',
                bloodGroup: basePatient?.bloodGroup || null,
                dateOfBirth: basePatient?.dateOfBirth || null,
                gender: basePatient?.gender || null,
                img: basePatient?.img || null,
                trackingId: apt.trackingId,
                appointmentTime: apt.scheduleDate,
                scheduleDate: apt.scheduleDate,
                scheduleTime: apt.scheduleTime,
                reasonForVisit: apt.reasonForVisit || apt.description || 'Clinical Consultation',
                status: apt.status,
                prescriptionStatus: apt.prescriptionStatus || (apt.prescription && apt.prescription.length > 0 ? 'issued' : 'notIssued'),
                totalAppointments: 1,
                appointments: [
                    {
                        id: apt.id,
                        trackingId: apt.trackingId,
                        scheduleDate: apt.scheduleDate,
                        scheduleTime: apt.scheduleTime,
                        reasonForVisit: apt.reasonForVisit,
                        description: apt.description,
                        status: apt.status,
                        prescriptionStatus: apt.prescriptionStatus,
                        prescription: apt.prescription,
                        medicalReports: apt.status === 'Completed' ? apt.medicalReports : []
                    }
                ]
            };
            patientMap.set(patientKey, patientRecord);
        } else {
            const existing = patientMap.get(patientKey);
            existing.totalAppointments += 1;
            existing.appointments.push({
                id: apt.id,
                trackingId: apt.trackingId,
                scheduleDate: apt.scheduleDate,
                scheduleTime: apt.scheduleTime,
                reasonForVisit: apt.reasonForVisit,
                description: apt.description,
                status: apt.status,
                prescriptionStatus: apt.prescriptionStatus,
                prescription: apt.prescription,
                medicalReports: apt.status === 'Completed' ? apt.medicalReports : []
            });
            if (apt.prescriptionStatus === 'issued' || (apt.prescription && apt.prescription.length > 0)) {
                existing.prescriptionStatus = 'issued';
            }
        }
    }

    return Array.from(patientMap.values());
};

const updateAppointmentByDoctor = async (user: any, payload: Partial<Appointments>): Promise<Appointments | null> => {
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const validatedPayload = validatePayload(appointmentDoctorUpdateWithIdSchema, payload);
    const appointment = await prisma.appointments.findFirst({
        where: { id: validatedPayload.id, doctorId: isDoctor.id },
        select: { id: true }
    })
    if (!appointment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Appointment was not found for this doctor.');
    }
    const { id, status, isFollowUp, patientType } = validatedPayload;
    const result = await prisma.appointments.update({
        where: { id: appointment.id },
        data: { status, isFollowUp, patientType }
    });
    return result;
}

/**
 * Ensures any legacy appointments have trackingId synchronized with their canonical appointment id.
 */
const syncUnifiedAppointmentIds = async (): Promise<number> => {
    const appointments = await prisma.appointments.findMany({
        select: { id: true, trackingId: true },
    });
    const mismatches = appointments.filter((apt) => apt.trackingId !== apt.id);
    if (mismatches.length === 0) {
        return 0;
    }
    await Promise.all(
        mismatches.map((apt) =>
            prisma.appointments.update({
                where: { id: apt.id },
                data: { trackingId: apt.id },
            })
        )
    );
    return mismatches.length;
};

export const AppointmentService = {
    createAppointment,
    getAllAppointments,
    getAppointment,
    getAppointmentConfirmation,
    deleteAppointment,
    updateAppointment,
    getPatientAppointmentById,
    getDoctorAppointmentsById,
    updateAppointmentByDoctor,
    getDoctorPatients,
    getPaymentInfoViaAppintmentId,
    getPatientPaymentInfo,
    getDoctorInvoices,
    createAppointmentByUnAuthenticateUser,
    getAppointmentByTrackingId,
    syncUnifiedAppointmentIds
}