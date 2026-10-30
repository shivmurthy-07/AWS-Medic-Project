import { validateAppointmentPatientInfo } from './appointmentValidation';

const validAppointmentInfo = {
    firstName: 'Ada',
    lastName: "O'Neil",
    email: 'ada@example.com',
    phone: '+91 9876543210',
    address: '123 Health Street',
    reasonForVisit: 'A consultation about recurring headaches.',
};

test('accepts a valid international-prefix Indian phone number', () => {
    expect(validateAppointmentPatientInfo(validAppointmentInfo)).toEqual({});
});

test('returns field-specific errors for malformed appointment details', () => {
    const errors = validateAppointmentPatientInfo({
        ...validAppointmentInfo,
        firstName: 'Name123',
        email: 'bad',
        phone: '123abc',
        reasonForVisit: 'short',
    });

    expect(errors).toMatchObject({
        firstName: expect.any(String),
        email: expect.any(String),
        phone: expect.any(String),
        reasonForVisit: expect.any(String),
    });
});
