import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/user-model.js';
import OTP from '../models/otp-model.js';
import dotenv from 'dotenv';
import passport from '../config/passport.js';
import { generateReferralCode, awardCredits } from '../services/creditService.js';

dotenv.config();

const router = express.Router();

// Nodemailer transporter — Gmail + App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Send OTP ────────────────────────────────────────────────────────────────
router.post('/sendotp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existingUser = await User.findOne({ email });
    // Block active accounts — only allow if account is soft-deleted (restoration flow)
    if (existingUser && !existingUser.isDeleted) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp });

    await transporter.sendMail({
      from: `"Trip Planner" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🌍 Trip Planner - Your OTP Code',
      html: `
<div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:25px;background:linear-gradient(135deg,#f5f7fa 0%,#e4e8eb 100%);color:#2d3748;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
  <h2 style="color:#2b6cb0;font-size:24px;text-align:center;margin-bottom:5px;">Your Trip Planner Verification Code</h2>
  <p style="text-align:center;color:#4a5568;margin-bottom:30px;">Ready to explore the world? First, let's verify your email</p>
  <div style="background:white;padding:25px;border-radius:10px;text-align:center;margin-bottom:25px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
    <p style="margin-bottom:15px;color:#4a5568;">Your one-time verification code:</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:16px 32px;background:#ebf8ff;color:#2b6cb0;border-radius:8px;display:inline-block;border:1px dashed #90cdf4;">
      ${otp}
    </div>
    <p style="font-size:14px;color:#718096;margin-top:16px;">This code expires in <strong style="color:#e53e3e;">5 minutes</strong></p>
  </div>
  <p style="text-align:center;color:#4a5568;">Simply enter this code in the verification screen to continue your travel planning journey.</p>
  <p style="font-size:12px;color:#718096;text-align:center;margin-top:20px;">For security reasons, do not share this code with anyone.</p>
  <footer style="text-align:center;margin-top:30px;">
    <p style="font-size:12px;color:#a0aec0;">© 2025 Trip Planner. All rights reserved.</p>
  </footer>
</div>
      `,
    });

    console.log(`✅ OTP sent to ${email}`);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP. Please try again.' });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
router.post('/resetpassword', async (req, res) => {
  try {
    const { email, otp, newpassword } = req.body;

    if (!email || !newpassword || !otp) {
      return res.status(400).json({ message: 'All input is required' });
    }

    const storedOtp = await OTP.findOne({ email, otp });
    if (!storedOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const timeDifference = (Date.now() - storedOtp.createdAt) / 1000;
    if (timeDifference > 300) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ message: 'OTP expired' });
    }

    await OTP.deleteOne({ email });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Account does not exist. Please create a new account first.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newpassword, salt);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// ─── Register (Verify OTP + Create User + Credit Bonus) ──────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullname, email, password, otp, referralCode: providedReferralCode } = req.body;

    if (!fullname || !email || !password || !otp) {
      return res.status(400).json({ message: 'All input is required' });
    }

    // Verify OTP
    const storedOtp = await OTP.findOne({ email, otp });
    if (!storedOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const timeDifference = (Date.now() - storedOtp.createdAt) / 1000;
    if (timeDifference > 300) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ message: 'OTP expired' });
    }

    await OTP.deleteOne({ email });

    // Validate referral code if provided
    let referrer = null;
    if (providedReferralCode && providedReferralCode.trim() !== '') {
      referrer = await User.findOne({ referralCode: providedReferralCode.trim().toUpperCase() }).lean();
      if (!referrer) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      if (referrer.email === email) {
        return res.status(400).json({ message: 'You cannot use your own referral code' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if a soft-deleted account exists with this email — restore it
    const existingDeleted = await User.findOne({ email, isDeleted: true });
    if (existingDeleted) {
      // Restore the account with a new password, keep credits as-is
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      existingDeleted.isDeleted = false;
      existingDeleted.deletedAt = null;
      existingDeleted.password = hashedPassword;
      existingDeleted.fullname = fullname;
      // Ensure they have a referral code (backfill if missing)
      if (!existingDeleted.referralCode) {
        existingDeleted.referralCode = await generateReferralCode();
      }
      await existingDeleted.save();

      console.log(`♻️ Restored deleted account: ${email} (credits preserved: ${existingDeleted.credits})`);

      const token = jwt.sign({ id: existingDeleted._id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true });
      return res.status(200).json({ message: 'Account restored successfully', token });
    }

    // Generate unique referral code for new user
    const newReferralCode = await generateReferralCode();

    // Create new user
    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : null,
      credits: 0,
    });

    // Award signup bonus (5 credits)
    await awardCredits(newUser._id, 5, 'signup_bonus');
    console.log(`✅ Awarded 5 signup credits to: ${newUser.email}`);

    // Award referral reward (25 credits) to referrer
    if (referrer) {
      await awardCredits(referrer._id, 25, 'referral_reward', newUser._id);
      console.log(`✅ Awarded 25 referral credits to: ${referrer.email}`);
    }

    const token = jwt.sign({ id: newUser._id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true });
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (err) {
    console.log(err);
    if (err.message === 'referral_code_generation_failed') {
      return res.status(500).json({ message: 'Could not generate referral code. Please try again.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Apply Referral Code (Google OAuth users, called post-login) ──────────────
router.post('/apply-referral', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('apply-referral JWT error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const { referralCode: providedCode } = req.body;
    console.log(`apply-referral called — userId: ${decoded.id}, code: ${providedCode}`);

    if (!providedCode || providedCode.trim() === '') {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      console.error(`apply-referral: user not found for id ${decoded.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`apply-referral: currentUser=${currentUser.email}, referredBy=${currentUser.referredBy}`);

    if (currentUser.referredBy) {
      return res.status(400).json({ message: 'Referral code already applied to this account' });
    }

    const code = providedCode.trim().toUpperCase();
    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) {
      console.warn(`apply-referral: no user found with referralCode=${code}`);
      return res.status(400).json({ message: 'Invalid referral code' });
    }
    if (referrer._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: 'You cannot use your own referral code' });
    }

    currentUser.referredBy = referrer._id;
    await currentUser.save();
    console.log(`✅ Applied referral code ${code} for: ${currentUser.email}`);

    await awardCredits(referrer._id, 25, 'referral_reward', currentUser._id);
    console.log(`✅ Awarded 25 referral credits to: ${referrer.email}`);

    res.status(200).json({ message: 'Referral code applied successfully' });
  } catch (err) {
    console.error('apply-referral error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Google OAuth Routes ──────────────────────────────────────────────────────

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure', session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userData = encodeURIComponent(
        JSON.stringify({
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          picture: user.picture,
          phone: user.phone,
        })
      );

      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/google/success?token=${token}&user=${userData}`);
    } catch (err) {
      console.error('Google callback error:', err);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/login?error=google_failed`);
    }
  }
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed. Please try again.' });
});

// ─── Backfill referral codes for existing users (run once) ───────────────────
// GET /auth/backfill-referral-codes  — safe to call multiple times (skips users who already have one)
router.get('/backfill-referral-codes', async (req, res) => {
  try {
    const usersWithoutCode = await User.find({ referralCode: { $exists: false } });
    let updated = 0;
    for (const user of usersWithoutCode) {
      try {
        const code = await generateReferralCode();
        user.referralCode = code;
        if (user.credits === undefined || user.credits === null) user.credits = 5;
        await user.save();
        updated++;
      } catch (e) {
        console.error(`Failed to backfill user ${user.email}:`, e.message);
      }
    }
    res.json({ message: `Backfilled ${updated} users` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
