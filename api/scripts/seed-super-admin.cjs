const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const envPath = path.resolve(__dirname, '../.env');
const envResult = require('dotenv').config({ path: envPath });

const prisma = new PrismaClient();
const usernamePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/;
const isDevelopment = (process.env.NODE_ENV || envResult.parsed?.NODE_ENV) === 'development';
const isValidIdentifier = (identifier) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) || usernamePattern.test(identifier);

const run = async () => {
    if (envResult.error && envResult.error.code !== 'ENOENT') {
        throw new Error(`Unable to load api/.env: ${envResult.error.message}`);
    }
    const email = (process.env.SUPER_ADMIN_EMAIL || (isDevelopment ? 'superadmin' : undefined))
        ?.trim()
        .toLowerCase();
    if (!email || !isValidIdentifier(email)) {
        throw new Error('Set SUPER_ADMIN_EMAIL in api/.env to an email or username (3-64 letters, numbers, dots, underscores, or hyphens).');
    }

    const existing = await prisma.auth.findUnique({ where: { email } });
    if (existing) {
        if (existing.role !== 'super_admin') {
            throw new Error('That email is already assigned to a non-Super Admin account.');
        }
        console.log('The configured Super Admin already exists; no changes were made.');
        return;
    }

    const configuredPassword = process.env.SUPER_ADMIN_PASSWORD;
    const password = configuredPassword || (isDevelopment ? `${randomBytes(24).toString('base64url')}!Aa1` : undefined);
    if (
        typeof password !== 'string' ||
        /^(your_|change_me|placeholder)/i.test(password.trim()) ||
        password.length < 12 ||
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/\d/.test(password) ||
        !/[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password)
    ) {
        throw new Error('Set SUPER_ADMIN_PASSWORD in api/.env to at least 12 characters with uppercase, lowercase, a number, and a symbol.');
    }

    await prisma.auth.create({
        data: {
            email,
            password: await bcrypt.hash(password, 12),
            role: 'super_admin',
            isDemo: false,
        },
    });
    if (configuredPassword) {
        console.log('Super Admin created. Store the configured credentials securely and remove the bootstrap password from the environment.');
    } else {
        console.log(`Super Admin created.\nUsername: ${email}\nGenerated password (shown once; save it now): ${password}`);
    }
};

run()
    .catch((error) => {
        console.error('Unable to create the Super Admin:', error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
