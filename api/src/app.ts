import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import CookieParser from 'cookie-parser';
import httpStatus from 'http-status';
import ApiError from './errors/apiError';
import router from './app/routes';
import config from './config';

import path from 'path';

const app: Application = express();

const allowedOrigins = new Set(
    [config.clientUrl, process.env.CLIENT_URL, process.env.CLIENT_LOCAL_URL, process.env.CLIENT__LOCAL_URL]
        .filter((origin): origin is string => Boolean(origin))
        .map((origin) => origin.replace(/\/+$/, ''))
);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) {
            return callback(null, true);
        }
        return callback(new ApiError(httpStatus.FORBIDDEN, 'This origin is not allowed to access the API.'));
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(CookieParser());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
})

app.get('/', (req: Request, res: Response) => {
    res.send(config.clientUrl)
})

app.use('/api/v1', router);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error('[api error]', req.method, req.baseUrl || 'request', err);
    if (err instanceof ApiError) {
        return res
            .status(err.statusCode)
            .json({ success: false, message: err.message });
    }
    const e = err as {
        statusCode?: number;
        status?: number;
        type?: string;
        code?: string;
        message?: string;
        stack?: string;
        name?: string;
    };
    if (e.type === 'entity.parse.failed') {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Malformed JSON request.' });
    }
    if (e.type === 'entity.too.large' || e.code === 'LIMIT_FILE_SIZE') {
        return res.status(Number(httpStatus.PAYLOAD_TOO_LARGE)).json({ success: false, message: 'Request payload exceeds the allowed size.' });
    }
    if (e.name === 'MulterError') {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'The uploaded file is invalid.' });
    }
    const statusCode: number =
        typeof e.statusCode === 'number' && e.statusCode >= 400 && e.statusCode < 600
            ? e.statusCode
            : typeof e.status === 'number' && e.status >= 400 && e.status < 600
                ? e.status
            : Number(httpStatus.INTERNAL_SERVER_ERROR);
    const body: Record<string, unknown> = {
        success: false,
        message: config.showErrorDetails
            ? e.message || String(err)
            : 'Something Went Wrong',
    };
    if (config.showErrorDetails && e.stack) {
        body.stack = e.stack;
    }
    if (config.showErrorDetails && e.name) {
        body.error = e.name;
    }
    return res.status(statusCode).json(body);
});

export default app;