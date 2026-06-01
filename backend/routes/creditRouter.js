import express from 'express';
import isLoggedIn from '../middlewares/isloggedin.js';
import userModel from '../models/user-model.js';
import CreditTransaction from '../models/creditTransaction-model.js';

const creditRouter = express.Router();

// GET /credits/balance — returns current credit balance and referral code
creditRouter.get('/balance', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select('credits referralCode').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      credits: user.credits ?? 0,
      referralCode: user.referralCode || null,
    });
  } catch (err) {
    console.error('Error fetching credit balance:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /credits/transactions — returns transaction history (newest first)
creditRouter.get('/transactions', isLoggedIn, async (req, res) => {
  try {
    const transactions = await CreditTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ transactions });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /credits/referral-code — returns the user's referral code
creditRouter.get('/referral-code', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select('referralCode').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ referralCode: user.referralCode || null });
  } catch (err) {
    console.error('Error fetching referral code:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default creditRouter;
