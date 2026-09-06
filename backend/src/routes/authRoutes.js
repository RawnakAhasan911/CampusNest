/**
 * Authentication Routes
 * Implements 2-Step Verification (2FA), pure PBKDF2 hashing,
 * RSA encryption for user data, and ECC encryption for OTP codes.
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Profile } = require('../models/Profile');
const { hashPassword, verifyPassword } = require('../crypto/kdf');
const { randomOtp } = require('../crypto/prng');
const {
  createBlindIndex,
  encryptDataRSA,
  decryptDataRSA,
  encryptDataECC,
  decryptDataECC,
} = require('../crypto/encryptionService');
const { keyManager } = require('../crypto/keyManager');
const {
  createSessionToken,
  verifySessionToken,
  revokeSession,
} = require('../middleware/sessionManager');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

/**
 * POST /api/auth/register
 * Registers student, encrypts all personal fields with RSA, generates user ECC keys,
 * and sets up ECC-encrypted email verification OTP.
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, phone, password, department, yearOfStudy } = req.body;

    // Check unique email via blind index
    const emailIndex = createBlindIndex(email);
    const existing = await User.findOne({ emailBlindIndex: emailIndex });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This university email is already registered. Please log in instead.',
      });
    }

    // 1. Hash password with custom PBKDF2-HMAC-SHA256
    const passwordHashRecord = hashPassword(password);

    // 2. Generate user-specific ECC keypair for peer messaging
    const userEccKeys = keyManager.generateUserEccKeyPair();

    // 3. Encrypt user's private ECC key with system RSA key
    const encryptedEccPrivateKey = encryptDataRSA(userEccKeys.privateKey);

    // 4. Encrypt all personal student data with system RSA
    const encryptedName = encryptDataRSA(name.trim());
    const encryptedEmail = encryptDataRSA(email.trim().toLowerCase());
    const encryptedPhone = encryptDataRSA(phone.trim());
    const encryptedDepartment = encryptDataRSA((department || 'Undeclared').trim());
    const encryptedYearOfStudy = encryptDataRSA((yearOfStudy || 'Freshman').trim());

    // 5. Generate 6-digit email verification OTP
    const verificationOtp = randomOtp(6);
    // Encrypt OTP using system ECC key
    const systemEccKey = keyManager.getActiveEccKey();
    const verificationOtpEncrypted = encryptDataECC(verificationOtp, systemEccKey.publicKey);
    const verificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const newUser = new User({
      emailBlindIndex: emailIndex,
      encryptedName,
      encryptedEmail,
      encryptedPhone,
      encryptedDepartment,
      encryptedYearOfStudy,
      passwordHash: passwordHashRecord.formatted,
      role: 'student',
      isVerified: false,
      verificationOtpEncrypted,
      verificationOtpExpires,
      eccPublicKey: userEccKeys.publicKey,
      encryptedEccPrivateKey,
      keyVersion: keyManager.activeRsaVersion,
      status: 'active',
    });

    await newUser.save();

    // Create default profile for the user
    const newProfile = new Profile({
      userId: newUser._id,
      encryptedBio: encryptDataRSA(`Hi, I am studying ${department || 'General Studies'}!`),
      encryptedPreferredLocation: encryptDataRSA('Near Campus'),
      lifestyle: {
        smoking: 'non-smoker',
        pets: 'no-pets',
        sleepSchedule: 'flexible',
        studyHabits: 'quiet-study',
        cleanliness: 'average',
        noisePreference: 'quiet',
        cookingHabits: 'occasional',
        guestPreference: 'weekends',
      },
    });
    await newProfile.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful! A verification code has been dispatched to your university email.',
      userId: newUser._id,
      // For demonstration & testing convenience, include demoOtp
      demoOtp: verificationOtp,
      encryptionInfo: {
        algorithmRSA: 'RSA-PKCS1v15-CUSTOM',
        algorithmECC: 'ECC-ELGAMAL-SECP256K1',
        kdf: 'PBKDF2-HMAC-SHA256',
        mac: 'HMAC-SHA256',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server registration error: ' + error.message });
  }
});

/**
 * POST /api/auth/verify-email
 * Verifies university email OTP code.
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'User ID and OTP code are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Account is already verified. You can log in.' });
    }

    if (!user.verificationOtpEncrypted || !user.verificationOtpExpires) {
      return res.status(400).json({ success: false, message: 'No pending verification code found' });
    }

    if (Date.now() > new Date(user.verificationOtpExpires).getTime()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Decrypt stored OTP using system ECC private key
    const systemEccKey = keyManager.getActiveEccKey();
    const storedOtp = decryptDataECC(user.verificationOtpEncrypted, systemEccKey.privateKey);

    if (storedOtp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code. Please try again.' });
    }

    user.isVerified = true;
    user.verificationOtpEncrypted = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'University email successfully verified! You may now log in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification error: ' + error.message });
  }
});

/**
 * POST /api/auth/login
 * Step 1 of 2FA:
 * Validates email & salted password hash.
 * If valid, generates ECC-encrypted 2FA OTP and issues temporary session token.
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || '';

    // Search user by email blind index
    const emailIndex = createBlindIndex(email);
    const user = await User.findOne({ emailBlindIndex: emailIndex });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid university email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account has been suspended by an administrator.' });
    }

    // Check password against PBKDF2-HMAC-SHA256 hash
    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid university email or password' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'University email is not yet verified. Please verify your email first.',
        needsEmailVerification: true,
        userId: user._id,
      });
    }

    // Step 2: Generate 2FA OTP
    const twoFactorOtp = randomOtp(6);
    const systemEccKey = keyManager.getActiveEccKey();
    const twoFactorOtpEncrypted = encryptDataECC(twoFactorOtp, systemEccKey.publicKey);
    const twoFactorOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.twoFactorOtpEncrypted = twoFactorOtpEncrypted;
    user.twoFactorOtpExpires = twoFactorOtpExpires;
    await user.save();

    // Create temporary session token with pending2FA flag
    const tempToken = createSessionToken({
      userId: user._id.toString(),
      role: user.role,
      userAgent,
      ip,
      pending2FA: true,
    });

    return res.json({
      success: true,
      requires2FA: true,
      tempToken,
      userId: user._id,
      message: 'Primary credentials accepted. Please enter the 2FA verification OTP sent to your university email.',
      // Demo OTP for convenience in grading and live demonstrations
      demoOtp: twoFactorOtp,
    });
  } catch (error) {
    console.error('Login step 1 error:', error);
    return res.status(500).json({ success: false, message: 'Login error: ' + error.message });
  }
});

/**
 * POST /api/auth/verify-2fa
 * Step 2 of 2FA:
 * Validates the second factor (OTP) against ECC-decrypted value and issues full session token.
 */
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || '';

    if (!tempToken || !otp) {
      return res.status(400).json({ success: false, message: 'Session token and 2FA OTP code are required' });
    }

    // Verify temp token (including anti-hijacking client checks)
    const verification = verifySessionToken(tempToken, userAgent, ip);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.error || 'Temporary 2FA session expired. Please log in again.',
        hijackAlert: verification.hijackAttempt || false,
      });
    }

    const user = await User.findById(verification.payload.uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorOtpEncrypted || !user.twoFactorOtpExpires) {
      return res.status(400).json({ success: false, message: 'No active 2FA OTP found. Please log in again.' });
    }

    if (Date.now() > new Date(user.twoFactorOtpExpires).getTime()) {
      return res.status(400).json({ success: false, message: '2FA OTP has expired. Please log in again.' });
    }

    // Decrypt stored 2FA OTP with system ECC private key
    const systemEccKey = keyManager.getActiveEccKey();
    const storedOtp = decryptDataECC(user.twoFactorOtpEncrypted, systemEccKey.privateKey);

    if (storedOtp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect 2FA code. Access denied.' });
    }

    // Clear 2FA OTP once verified
    user.twoFactorOtpEncrypted = undefined;
    user.twoFactorOtpExpires = undefined;
    await user.save();

    // Revoke temporary 2FA token
    revokeSession(verification.payload.sid);

    // Issue fully authenticated session token
    const fullSessionToken = createSessionToken({
      userId: user._id.toString(),
      role: user.role,
      userAgent,
      ip,
      pending2FA: false,
    });

    const decryptedUser = user.getDecryptedData();

    return res.json({
      success: true,
      message: 'Two-factor authentication successful! Access granted.',
      token: fullSessionToken,
      user: decryptedUser,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({ success: false, message: '2FA verification error: ' + error.message });
  }
});

/**
 * POST /api/auth/logout
 * Destroys session token preventing replay or hijacking.
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    revokeSession(req.session.sid);
    return res.json({ success: true, message: 'Session successfully revoked. Logged out.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout error' });
  }
});

/**
 * GET /api/auth/me
 * Returns authenticated student's decrypted profile data.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const decryptedUser = req.user.getDecryptedData();
    const profile = await Profile.findOne({ userId: req.user._id });
    const decryptedProfile = profile ? profile.getDecryptedProfile(true) : null;

    return res.json({
      success: true,
      user: decryptedUser,
      profile: decryptedProfile,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving user data' });
  }
});

module.exports = router;
