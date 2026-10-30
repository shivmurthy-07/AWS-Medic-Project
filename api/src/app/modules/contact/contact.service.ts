import { Transporter } from '../../../helpers/Transporter';
import { contactPayloadSchema } from './contact.validation';
import { validatePayload } from '../../../helpers/validation';

interface ContactPayload {
    email: string;
    firstName: string;
    lastName: string;
    subject: string;
    text: string;
}

const contactUs = async (payload: ContactPayload): Promise<{ message: string }> => {
    const { email, firstName, lastName, subject, text } = validatePayload(contactPayloadSchema, payload);
    const mailOptions = {
        from: `"${firstName + ' ' + lastName}" <${email}>`,
        to: 'ujjalzaman+doctor@gmail.com',
        subject,
        text
    };
    await Transporter.sendMail(mailOptions);
    return {
        message: "Successfully sent message."
    };
}

export const ContactService = {
    contactUs
}