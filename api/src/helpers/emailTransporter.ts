import fs from 'fs';
import handlebars from 'handlebars';
import ApiError from '../errors/apiError';
import httpStatus from 'http-status';
import { Transporter } from './Transporter';
import config from '../config';

type IEmailProps = {
    pathName: string;
    replacementObj: any,
    toMail: string,
    subject: string,
}
export const EmailtTransporter = async({pathName,replacementObj, toMail, subject }:IEmailProps) =>{  
    const senderEmail = config.gmail_app_Email?.trim();
    const emailPassword = config.emailPass?.trim();
    const hasPlaceholderConfig = [senderEmail, emailPassword].some((value) =>
        value && /^(your_|change_me|placeholder)/i.test(value)
    );
    if (!senderEmail || !emailPassword || hasPlaceholderConfig) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Email delivery is temporarily unavailable. Please try again later.'
        );
    }

    const html = await readHtmlFile(pathName);
    const template = handlebars.compile(html);
    const htmlToSend = template(replacementObj);
    
    const mailOptions = {
        from: senderEmail,
        to: toMail,
        subject: subject,
        html: htmlToSend
    };

    try {
        await Transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Email delivery failed. Please try again later.'
        );
    }
};

const readHtmlFile = async(path:string): Promise<string> =>{
    try {
        const html = await fs.promises.readFile(path, {encoding: 'utf-8'});
        return html
    } catch (error) {
        console.log("Error Reading html file", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Unable to read HTML file")
    }
}