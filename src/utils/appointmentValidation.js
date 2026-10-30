const namePattern = /^[\p{L}\p{M}][\p{L}\p{M} '-]*$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const indianMobilePattern = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

export const validateAppointmentPatientInfo = (values) => {
    const errors = {};
    const firstName = values.firstName?.trim() || '';
    const lastName = values.lastName?.trim() || '';
    const email = values.email?.trim() || '';
    const phone = values.phone?.trim() || '';
    const address = values.address?.trim() || '';
    const reasonForVisit = values.reasonForVisit?.trim() || '';
    const description = values.description?.trim() || '';

    if (!firstName) {
        errors.firstName = 'Enter your first name.';
    } else if (firstName.length > 50 || !namePattern.test(firstName)) {
        errors.firstName = 'Use up to 50 letters, spaces, hyphens, or apostrophes.';
    }

    if (!lastName) {
        errors.lastName = 'Enter your last name.';
    } else if (lastName.length > 50 || !namePattern.test(lastName)) {
        errors.lastName = 'Use up to 50 letters, spaces, hyphens, or apostrophes.';
    }

    if (!email) {
        errors.email = 'Enter your email address.';
    } else if (email.length > 254 || !emailPattern.test(email)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!phone) {
        errors.phone = 'Enter a valid Indian mobile number.';
    } else if (!indianMobilePattern.test(phone)) {
        errors.phone = 'Enter 10 digits starting with 6, 7, 8, or 9, optionally prefixed by +91.';
    }

    if (!address) {
        errors.address = 'Enter your address.';
    } else if (address.length < 10 || address.length > 250) {
        errors.address = 'Address must be between 10 and 250 characters.';
    }

    if (!reasonForVisit) {
        errors.reasonForVisit = 'Describe the reason for your visit.';
    } else if (reasonForVisit.length < 10 || reasonForVisit.length > 1000) {
        errors.reasonForVisit = 'Reason for visit must be between 10 and 1,000 characters.';
    }

    if (description.length > 1000) {
        errors.description = 'Additional notes must be 1,000 characters or fewer.';
    }

    return errors;
};
