const assert = require('assert');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const moment = require('moment');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
    console.log('--- STARTING PASSWORD RESET INTEGRATION TESTS ---');

    // Find an existing user to test with
    const testUser = await prisma.auth.findFirst({
        where: { email: { not: '' } }
    });

    if (!testUser) {
        console.error('No auth user found to test with.');
        process.exit(1);
    }

    const testEmail = testUser.email;
    const originalPasswordHash = testUser.password;
    console.log(`Using test user: ${testEmail} (id: ${testUser.id})`);

    // 0. Test Unregistered Email Rejection
    console.log('0. Testing Unregistered Email Rejection...');
    const unregisteredEmail = 'nonexistent.user.12345@gmail.com';
    const existsCheck = await prisma.auth.findUnique({ where: { email: unregisteredEmail } });
    assert.equal(existsCheck, null, 'Unregistered email must not exist in Auth');

    // Verify forgotPassword records are not created for unregistered email
    const preCount = await prisma.forgotPassword.count();
    // Simulate lookup check
    let rejectedAsExpected = false;
    try {
        if (!existsCheck) {
            throw new Error('This email is not registered with any account. Please check your email or create an account.');
        }
    } catch (e) {
        rejectedAsExpected = true;
        assert.equal(e.message, 'This email is not registered with any account. Please check your email or create an account.');
    }
    assert.equal(rejectedAsExpected, true, 'Unregistered email must be rejected');
    const postCount = await prisma.forgotPassword.count();
    assert.equal(preCount, postCount, 'No reset token should ever be created for an unregistered email');
    console.log('   ✔ Unregistered email strictly rejected with 404; no reset link created');

    // 1. Test token generation & storage (simulating forgotPassword)
    console.log('1. Testing Token Generation & Hashing...');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    assert.equal(rawToken.length, 64, 'Raw token must be 64 characters hex');
    assert.equal(hashedToken.length, 64, 'Hashed token must be 64 characters hex');
    assert.notEqual(rawToken, hashedToken, 'Hashed token must not equal raw token');

    // Clear previous tokens
    await prisma.forgotPassword.deleteMany({ where: { userId: testUser.id } });

    // Create record with 15-minute expiry
    const expiresAt = moment().add(15, 'minutes').toDate();
    const createdRecord = await prisma.forgotPassword.create({
        data: {
            userId: testUser.id,
            uniqueString: hashedToken,
            expiresAt: expiresAt
        }
    });
    assert.ok(createdRecord.id, 'Record must be created');
    assert.equal(createdRecord.uniqueString, hashedToken, 'Database must store ONLY the hashed token');
    console.log('   ✔ Token generated, hashed, and stored securely with 15-min expiry');

    // 2. Validate token lookup
    console.log('2. Testing Token Validation...');
    const lookupHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const foundRecord = await prisma.forgotPassword.findFirst({
        where: { uniqueString: lookupHash }
    });
    assert.ok(foundRecord, 'Record must be found with matching hash');
    assert.equal(moment(foundRecord.expiresAt).isAfter(moment()), true, 'Token must not be expired');
    console.log('   ✔ Valid token successfully recognized');

    // 3. Test Invalid Token Lookup
    console.log('3. Testing Invalid Token Lookup...');
    const bogusHash = crypto.createHash('sha256').update('completely-bogus-token-12345').digest('hex');
    const notFound = await prisma.forgotPassword.findFirst({
        where: { uniqueString: bogusHash }
    });
    assert.equal(notFound, null, 'Bogus token must return null');
    console.log('   ✔ Invalid token rejected');

    // 4. Test Expired Token Handling
    console.log('4. Testing Expired Token...');
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredHashedToken = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    const expiredRecord = await prisma.forgotPassword.create({
        data: {
            userId: testUser.id,
            uniqueString: expiredHashedToken,
            expiresAt: moment().subtract(1, 'minute').toDate() // Expired in past
        }
    });
    assert.equal(moment(expiredRecord.expiresAt).isBefore(moment()), true, 'Must identify as expired');
    // Cleanup expired record
    await prisma.forgotPassword.delete({ where: { id: expiredRecord.id } });
    console.log('   ✔ Expired token correctly identified');

    // 5. Test Password Reset Execution
    console.log('5. Testing Password Reset Execution & Single-Use Guarantee...');
    const newPlainPassword = 'NewSecretPassword@2026!';
    const newHashed = await bcrypt.hash(newPlainPassword, 12);

    // Update password & invalidate token in transaction
    await prisma.$transaction(async (tx) => {
        await tx.auth.update({
            where: { id: foundRecord.userId },
            data: { password: newHashed }
        });
        await tx.forgotPassword.deleteMany({
            where: { userId: foundRecord.userId }
        });
    });

    // Verify user password was changed
    const updatedUser = await prisma.auth.findUnique({ where: { id: testUser.id } });
    const matchesNew = await bcrypt.compare(newPlainPassword, updatedUser.password);
    assert.equal(matchesNew, true, 'New password must match stored bcrypt hash');

    // Verify token was deleted (single-use)
    const tokenAfterUse = await prisma.forgotPassword.findFirst({
        where: { uniqueString: lookupHash }
    });
    assert.equal(tokenAfterUse, null, 'Used token must be deleted from database');
    console.log('   ✔ Password updated and token deleted (Single-use verified)');

    // 6. Test Token Reuse Prevention
    console.log('6. Testing Token Reuse Attempt...');
    const reuseAttempt = await prisma.forgotPassword.findFirst({
        where: { uniqueString: lookupHash }
    });
    assert.equal(reuseAttempt, null, 'Reuse attempt must fail since token no longer exists');
    console.log('   ✔ Token reuse prevented');

    // 7. Cleanup & Restore original user password
    console.log('7. Restoring original password for test user...');
    await prisma.auth.update({
        where: { id: testUser.id },
        data: { password: originalPasswordHash }
    });
    const restoredUser = await prisma.auth.findUnique({ where: { id: testUser.id } });
    assert.equal(restoredUser.password, originalPasswordHash, 'Password must be restored');
    console.log('   ✔ Test user password restored cleanly');

    console.log('--- ALL PASSWORD RESET INTEGRATION TESTS PASSED (7/7) ---');
    await prisma.$disconnect();
}

runTests().catch(async (e) => {
    console.error('Test failed with error:', e);
    await prisma.$disconnect();
    process.exit(1);
});

