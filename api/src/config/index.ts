import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const apiEnvPath = path.resolve(__dirname, '../../../api/.env');
const workingEnvPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: fs.existsSync(apiEnvPath) ? apiEnvPath : workingEnvPath });

const isDevelopment = process.env.NODE_ENV === 'development';
const clientUrl = isDevelopment
    ? process.env.CLIENT_LOCAL_URL || process.env.CLIENT__LOCAL_URL || 'http://localhost:3000'
    : process.env.CLIENT_URL;

const showErrorDetails =
    process.env.NODE_ENV !== 'production' ||
    process.env.SHOW_ERROR_DETAILS === 'true' ||
    process.env.VERCEL_ENV === 'preview';

export default {
    env: process.env.NODE_ENV,
    showErrorDetails,
    port: process.env.PORT || '5050',
    default_doctor_pass: process.env.DOCTOR_PASS,
    clientUrl: clientUrl,
    jwt: {
        secret: process.env.JWT_SECRET || process.env.JWT_SCRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRED_IN,
        refresh_secret:
            process.env.JWT_REFRESH_SECRET ?? process.env.JWT_REFRESH_SCRET,
    },
 cloudinary: {
    name: process.env.CLOUD_NAME || process.env.CLOUND_NAME,
    key: process.env.API_KEY,
    secret: process.env.API_SECRET
},
    emailPass: process.env.EMAIL_PASS,
    adminEmail: process.env.ADMIN_EMAIL,
    gmail_app_Email: process.env.GMAIL_APP_EMAIL,
    defaultAdminDoctor: process.env.DEFULT_ADMIN_DOCTOR,
    backendLiveUrl: process.env.BACKEND_LIVE_URL,
    backendLocalUrl: process.env.BACKEND_LOCAL_URL
}