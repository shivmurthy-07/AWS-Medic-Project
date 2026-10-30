import { v2 as cloudinary } from 'cloudinary'
import config from '../config';
import multer from 'multer';
import { ICloudinaryResponse } from '../interfaces/file';
import ApiError from '../errors/apiError';
import httpStatus from 'http-status';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

if (config.cloudinary.name && config.cloudinary.key && config.cloudinary.secret) {
    cloudinary.config({
        cloud_name: config.cloudinary.name,
        api_key: config.cloudinary.key,
        api_secret: config.cloudinary.secret
    });
}

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxImageSize, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!allowedImageTypes.has(file.mimetype.toLowerCase())) {
            return callback(new ApiError(httpStatus.BAD_REQUEST, 'Please upload a valid JPG, JPEG, PNG, or WEBP image.'));
        }
        callback(null, true);
    },
});

const hasValidImageSignature = (buffer: Buffer): boolean => {
    if (!buffer || buffer.length < 4) return false;
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP';
    return isJpeg || isPng || isWebp;
};

const isCloudinaryUsable = (): boolean => {
    const { name, key, secret } = config.cloudinary;
    if (!name || !key || !secret) return false;
    const isPlaceholder = [name, key, secret].some((val) =>
        /^(your_|change_me|placeholder)/i.test(val)
    );
    return !isPlaceholder;
};

const saveLocally = async (file: { buffer: Buffer; size: number; originalname?: string; mimetype?: string }): Promise<ICloudinaryResponse> => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const mime = (file.mimetype || '').toLowerCase();
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const fileName = `doc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, file.buffer);

    const baseUrl = config.backendLocalUrl
        ? config.backendLocalUrl.replace(/\/api\/v1\/?.*$/, '')
        : `http://localhost:${config.port || 5050}`;
    const fileUrl = `${baseUrl}/uploads/${fileName}`;

    return {
        secure_url: fileUrl,
        public_id: fileName,
        format: ext,
        bytes: file.size,
    } as unknown as ICloudinaryResponse;
};

const uploadFile = async (file: { buffer: Buffer; size: number; originalname?: string; mimetype?: string }): Promise<ICloudinaryResponse> => {
    if (!file?.buffer) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please select an image file to upload.');
    }
    if (file.size > maxImageSize) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Image size exceeds the 5 MB limit. Please select a smaller image.');
    }
    if (!hasValidImageSignature(file.buffer)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid image file. Only JPG, JPEG, PNG, and WEBP images are supported.');
    }

    if (isCloudinaryUsable()) {
        try {
            return await new Promise<ICloudinaryResponse>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'image', folder: 'doctorOnCall' },
                    (error: any, result: any) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                ).end(file.buffer);
            });
        } catch (cloudinaryErr: any) {
            console.warn('Cloudinary upload error, using local fallback:', cloudinaryErr?.message || cloudinaryErr);
            return await saveLocally(file);
        }
    }

    return await saveLocally(file);
};

export const CloudinaryHelper = {
    uploadFile,
    upload
}