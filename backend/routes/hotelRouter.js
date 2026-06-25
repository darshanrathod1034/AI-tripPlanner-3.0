import express from 'express';
import rateLimit from 'express-rate-limit';
import isLoggedIn from '../middlewares/isloggedin.js';
import { getHotels } from '../services/hotelService.js';
import AffiliateClick from '../models/affiliateClick-model.js';

const hotelRouter = express.Router();

// Hotel-specific rate limiter — 20 requests per hour per IP
const hotelLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Hotel search limit reached. Please try again in an hour.' },
});

// ─── GET /api/hotels ──────────────────────────────────────────────────────────
// Search hotels for a destination and date range
hotelRouter.get('/', isLoggedIn, hotelLimiter, async (req, res) => {
  if (!process.env.BOOKING_AFFILIATE_ID) {
    return res.status(500).json({ error: 'affiliate_id_not_configured' });
  }

  const { destination, startDate, endDate } = req.query;

  try {
    const hotels = await getHotels(destination, startDate, endDate);
    return res.json({ hotels });
  } catch (err) {
    if (err.code === 'HOTEL_TIMEOUT') {
      return res.status(504).json({ error: 'Hotel search timed out' });
    }
    return res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// ─── POST /api/hotels/track-click ────────────────────────────────────────────
// Fire-and-forget affiliate click tracking
hotelRouter.post('/track-click', isLoggedIn, (req, res) => {
  const { destination, hotelId, sessionId } = req.body;

  // Respond immediately — fire and forget
  res.status(200).json({ ok: true });

  AffiliateClick.create({
    userId: req.user._id,
    destination,
    hotelId,
    sessionId,
  }).catch((err) => console.error('Click track error:', err));
});

// ─── GET /api/admin/hotel-clicks ─────────────────────────────────────────────
// Admin-only aggregated click stats
hotelRouter.get('/admin/hotel-clicks', isLoggedIn, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const [total, byDestination, byDay] = await Promise.all([
      AffiliateClick.countDocuments(),
      AffiliateClick.aggregate([
        { $group: { _id: '$destination', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AffiliateClick.aggregate([
        {
          $match: {
            clickedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.json({ total, byDestination, byDay });
  } catch (err) {
    console.error('Admin hotel-clicks error:', err);
    return res.status(500).json({ error: 'Failed to fetch click stats' });
  }
});

export default hotelRouter;
