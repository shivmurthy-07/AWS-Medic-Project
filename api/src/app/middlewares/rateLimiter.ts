import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
}

/**
 * Lightweight in-memory rate limiter for sensitive authentication endpoints
 */
export const createRateLimiter = (options: RateLimitOptions) => {
    const { windowMs, max, message = 'Too many requests. Please try again later.' } = options;
    const store = new Map<string, RateLimitEntry>();

    // Cleanup expired entries periodically (every 5 minutes)
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (entry.resetTime <= now) {
                store.delete(key);
            }
        }
    }, 5 * 60 * 1000).unref();

    return (req: Request, res: Response, next: NextFunction): void => {
        const clientIp =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.ip ||
            req.socket.remoteAddress ||
            'unknown-ip';

        // Derive key from IP and optionally the route path
        const key = `${clientIp}:${req.baseUrl || ''}${req.path}`;
        const now = Date.now();
        const record = store.get(key);

        if (!record || record.resetTime <= now) {
            store.set(key, { count: 1, resetTime: now + windowMs });
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', max - 1);
            return next();
        }

        if (record.count >= max) {
            const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfterSeconds);
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.status(httpStatus.TOO_MANY_REQUESTS).json({
                success: false,
                statusCode: httpStatus.TOO_MANY_REQUESTS,
                message: message,
                retryAfterSeconds,
            });
            return;
        }

        record.count += 1;
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        return next();
    };
};

