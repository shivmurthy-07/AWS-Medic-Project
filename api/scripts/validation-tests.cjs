const assert = require('node:assert/strict');
const { test } = require('node:test');

const { validateRegistrationPayload } = require('../dist/helpers/registrationValidation');
const { loginSchema, resetPasswordSchema, passwordResetConfirmSchema } =
    require('../dist/app/modules/auth/auth.validation');
const { appointmentCreateSchema, appointmentAdminUpdateSchema, appointmentPatientUpdateSchema } =
    require('../dist/app/modules/appointment/appointment.validation');
const { createBlogSchema, updateBlogSchema } = require('../dist/app/modules/blog/blog.validation');
const { contactPayloadSchema } = require('../dist/app/modules/contact/contact.validation');
const { favouriteSchema } = require('../dist/app/modules/favourites/favourites.validation');
const { createMedicinesSchema, updateMedicineSchema } =
    require('../dist/app/modules/medicines/medicine.validation');
const { patientProfileUpdateSchema } = require('../dist/app/modules/patient/patient.validation');
const { createPrescriptionSchema } = require('../dist/app/modules/prescription/prescription.validation');
const { createReviewSchema } = require('../dist/app/modules/reviews/reviews.validation');
const { rejectDoctorSchema } = require('../dist/app/modules/superAdmin/superAdmin.validation');
const {
    doctorProfileUpdateSchema,
    doctorRegistrationSchema,
} = require('../dist/app/modules/doctor/doctor.validation');
const {
    createTimeSlotSchema,
    updateTimeSlotSchema,
} = require('../dist/app/modules/doctorTimeSlot/doctorTimeSlot.validation');

const validAppointment = {
    patientInfo: {
        firstName: 'Ada',
        lastName: "O'Neil",
        email: ' ADA@example.com ',
        phone: '+91 9876543210',
        address: '123 Health Street',
        reasonForVisit: 'A consultation about recurring headaches.',
        doctorId: '4e6f3844-bc49-4c67-b2d0-13ee847eb21c',
        scheduleDate: '2099-12-01 10:00:00',
        scheduleTime: '10:00 AM',
    },
    payment: { paymentMethod: 'paypal', paymentType: 'creditCard' },
};

test('registration trims names and normalizes email while rejecting malformed fields', () => {
    const data = validateRegistrationPayload({
        firstName: '  Zoë ',
        lastName: "O'Neil",
        email: ' ZOE@example.com ',
        password: 'StrongPass1!',
    });
    assert.equal(data.firstName, 'Zoë');
    assert.equal(data.email, 'zoe@example.com');
    assert.throws(() => validateRegistrationPayload({
        firstName: 'Name123',
        lastName: 'Person',
        email: 'bad',
        password: 'weak',
    }));
});

test('authentication schemas validate credentials, reset tokens, and privileged extra fields', () => {
    assert.equal(loginSchema.safeParse({ email: ' USER@example.com ', password: 'abc' }).success, true);
    assert.equal(loginSchema.safeParse({ email: 'superadmin', password: 'abc' }).success, true);
    assert.equal(loginSchema.safeParse({ email: 'bad username', password: 'abc' }).success, false);
    assert.equal(loginSchema.safeParse({ email: 'a', password: 'abc' }).success, false);
    assert.equal(loginSchema.safeParse({ email: 'a@b.com', password: 'x', role: 'admin' }).success, false);
    assert.equal(resetPasswordSchema.safeParse({ email: 'user@example.com' }).success, true);
    assert.equal(passwordResetConfirmSchema.safeParse({
        userId: '4e6f3844-bc49-4c67-b2d0-13ee847eb21c',
        uniqueString: 'reset-token',
        password: 'StrongPass1!',
    }).success, true);
});

test('appointment schemas enforce dates, enumerated payment values, and role-specific updates', () => {
    assert.equal(appointmentCreateSchema.safeParse(validAppointment).success, true);
    assert.equal(appointmentCreateSchema.safeParse({
        ...validAppointment,
        payment: { paymentMethod: 'cash', paymentType: 'cash' },
    }).success, true);
    assert.equal(appointmentCreateSchema.safeParse({
        ...validAppointment,
        payment: { paymentMethod: 'demo', paymentType: 'creditCard' },
    }).success, true);
    assert.equal(appointmentCreateSchema.safeParse({
        ...validAppointment,
        payment: {
            paymentMethod: 'demo',
            paymentType: 'creditCard',
            cardNumber: '4242424242424242',
            cvv: '123',
        },
    }).success, false);
    assert.equal(appointmentCreateSchema.safeParse({
        ...validAppointment,
        payment: { paymentMethod: 'not-a-method', paymentType: 'creditCard' },
    }).success, false);
    assert.equal(appointmentCreateSchema.safeParse({
        ...validAppointment,
        patientInfo: { ...validAppointment.patientInfo, scheduleDate: '2000-01-01 10:00:00' },
    }).success, false);
    assert.equal(appointmentAdminUpdateSchema.safeParse({ patientId: 'attacker' }).success, false);
    assert.equal(appointmentPatientUpdateSchema.safeParse({ status: 'cancel' }).success, true);
    assert.equal(appointmentPatientUpdateSchema.safeParse({ status: 'paid' }).success, false);
});

test('patient profiles accept only supported fields and valid values', () => {
    assert.equal(patientProfileUpdateSchema.safeParse({ firstName: '  Zoë ' }).success, true);
    assert.equal(patientProfileUpdateSchema.safeParse({ isActive: false }).success, false);
    assert.equal(patientProfileUpdateSchema.safeParse({ mobile: '123abc' }).success, false);
    assert.equal(patientProfileUpdateSchema.safeParse({ dateOfBirth: '2099-01-01' }).success, false);
});

test('contact and blog schemas reject invalid, oversized, and server-controlled input', () => {
    assert.equal(contactPayloadSchema.safeParse({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        subject: 'Appointment question',
        text: 'Please contact me about booking.',
    }).success, true);
    assert.equal(contactPayloadSchema.safeParse({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'not-email',
        subject: 'A',
        text: '',
    }).success, false);
    assert.equal(createBlogSchema.safeParse({ title: 'Health news', description: 'A sufficiently long article body.' }).success, true);
    assert.equal(createBlogSchema.safeParse({
        title: 'Health news',
        description: 'A sufficiently long article body.',
        userId: 'attacker',
    }).success, false);
    assert.equal(updateBlogSchema.safeParse({}).success, false);
});

test('review, favourite, medicine, and prescription schemas reject invalid identifiers and values', () => {
    const doctorId = '4e6f3844-bc49-4c67-b2d0-13ee847eb21c';
    const review = {
        doctorId,
        description: 'The doctor explained the treatment clearly.',
        star: '5',
        isRecommended: true,
    };
    assert.equal(createReviewSchema.safeParse(review).success, true);
    assert.equal(createReviewSchema.safeParse({ ...review, star: '6' }).success, false);
    assert.equal(favouriteSchema.safeParse({ doctorId }).success, true);
    assert.equal(favouriteSchema.safeParse({ doctorId: 'bad' }).success, false);
    assert.equal(createMedicinesSchema.safeParse([{
        prescriptionId: doctorId,
        medicine: 'Medicine A',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '7 days',
    }]).success, true);
    assert.equal(updateMedicineSchema.safeParse({
        id: doctorId, medicine: 'Medicine A', dosage: '1 tablet',
        frequency: 'Twice daily', duration: '7 days',
    }).success, true);
    assert.equal(createPrescriptionSchema.safeParse({
        appointmentId: doctorId,
        status: 'Completed',
        patientType: 'Recovering',
        disease: 'Headache',
        medicine: [{
            medicine: 'Medicine A',
            dosage: '1 tablet',
            frequency: 'Twice daily',
            duration: '7 days',
        }],
    }).success, true);
});

test('Super Admin rejection reason is bounded and non-empty', () => {
    assert.equal(rejectDoctorSchema.safeParse({ reason: 'Missing required documents.' }).success, true);
    assert.equal(rejectDoctorSchema.safeParse({ reason: 'No' }).success, false);
});

test('doctor and availability schemas validate names, prices, and non-overlapping intervals', () => {
    const doctor = {
        firstName: '  Zoë ',
        lastName: "O'Neil",
        email: 'doctor@example.com',
        password: 'StrongPass1!',
        specialization: 'Cardiologist',
    };
    assert.equal(doctorRegistrationSchema.safeParse(doctor).success, true);
    assert.equal(doctorRegistrationSchema.safeParse({ ...doctor, firstName: 'Name123' }).success, false);
    assert.equal(doctorRegistrationSchema.safeParse({ ...doctor, specialization: '' }).success, false);
    const doctorWithoutSpecialization = { ...doctor };
    delete doctorWithoutSpecialization.specialization;
    assert.equal(doctorRegistrationSchema.safeParse(doctorWithoutSpecialization).success, false);
    assert.equal(doctorProfileUpdateSchema.safeParse({ price: '-1' }).success, false);
    assert.equal(doctorProfileUpdateSchema.safeParse({ role: 'super_admin' }).success, false);
    assert.equal(doctorProfileUpdateSchema.safeParse({
        phone: null,
        biography: null,
        dob: null,
        price: null,
        address: null,
    }).success, true);
    assert.equal(doctorProfileUpdateSchema.safeParse({ phone: 'not-a-phone' }).success, false);
    assert.equal(createTimeSlotSchema.safeParse({
        day: 'monday',
        timeSlot: [{ startTime: '09:00', endTime: '10:00' }],
        maximumPatient: 5,
    }).success, true);
    assert.equal(createTimeSlotSchema.safeParse({
        day: 'monday',
        timeSlot: [
            { startTime: '09:00', endTime: '10:00' },
            { startTime: '09:30', endTime: '10:30' },
        ],
    }).success, false);
    assert.equal(updateTimeSlotSchema.safeParse({ timeSlot: [{ id: 1, startTime: '10:00', endTime: '09:00' }] }).success, false);
});
