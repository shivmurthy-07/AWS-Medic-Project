import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

export const getTokenFromAuthorization = (authorization?: string): string | null => {
    if (!authorization) {
        return null;
    }
    const value = authorization.trim();
    const bearerMatch = value.match(/^Bearer\s+(\S+)$/i);
    if (bearerMatch) {
        return bearerMatch[1];
    }
    return value && !/\s/.test(value) ? value : null;
};

const createToken = (payload: object, secret: Secret, expireTime: string) => {
    const options: SignOptions = { expiresIn: expireTime as SignOptions['expiresIn'] };
    return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
    return jwt.verify(token, secret) as JwtPayload
}

export const JwtHelper = {
    verifyToken,
    createToken
}