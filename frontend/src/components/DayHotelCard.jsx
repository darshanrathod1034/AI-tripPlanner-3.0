import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, BedDouble } from 'lucide-react';

// ─── Budget tier config ────────────────────────────────────────────────────────
const BUDGET_CONFIG = {
  cheap: {
    label: 'Budget Friendly',
    stars: '2–3★',
    minScore: '6.0+',
    scoreLabel: 'Pleasant',
    description: 'Highly-rated 2–3 star hotels near your daily stops',
    nflt: 'class%3D2%3Bclass%3D3%3Breview_score%3D60',
  },
  moderate: {
    label: 'Mid-range',
    stars: '3–4★',
    minScore: '7.0+',
    scoreLabel: 'Good',
    description: 'Comfortable 3–4 star hotels near your daily stops',
    nflt: 'class%3D3%3Bclass%3D4%3Breview_score%3D70',
  },
  luxury: {
    label: 'Premium',
    stars: '4–5★',
    minScore: '8.0+',
    scoreLabel: 'Excellent',
    description: 'Luxury 4–5 star hotels near your daily stops',
    nflt: 'class%3D4%3Bclass%3D5%3Breview_score%3D80',
  },
};

/**
 * Normalise the raw budget value (string label or numeric amount) to a tier key.
 * @param {string|number} budget
 * @returns {'cheap'|'moderate'|'luxury'}
 */
export const normalizeBudget = (budget) => {
  if (typeof budget === 'string') {
    const lower = budget.toLowerCase().trim();
    if (lower === 'cheap' || lower === 'budget friendly' || lower === 'budget') return 'cheap';
    if (lower === 'luxury') return 'luxury';
    if (lower === 'moderate') return 'moderate';
  }
  if (typeof budget === 'number') {
    if (budget <= 1500) return 'cheap';
    if (budget <= 3000) return 'moderate';
    return 'luxury';
  }
  return 'moderate';
};

/**
 * Convert a Date / ISO string to YYYY-MM-DD.
 */
const toYMD = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().split('T')[0];
};

/**
 * Strips zip codes, pincodes (like Goa 403402 -> Goa), and trailing/leading commas or whitespace.
 * @param {string} name
 * @returns {string}
 */
export const cleanAreaName = (name) => {
  if (!name) return '';
  // Remove 5-digit zip codes and 6-digit pin codes (with optional space/dash in the middle)
  let cleaned = name
    .replace(/(\b\d{3}[\s-]?\d{3}\b)|(\b\d{5}\b)/g, '')
    .replace(/,\s*,/g, ',') // double commas
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '') // leading/trailing spaces, commas, dashes, dots
    .trim();

  if (!cleaned || /^[\d\s,.-]+$/.test(cleaned)) {
    return name;
  }
  return cleaned;
};

/**
 * DayHotelCard - Sleek, minimalistic, matches existing itinerary cards
 */
const DayHotelCard = ({
  dayNumber,
  dayColor,
  areaName,
  destination,
  budget,
  startDate,
  endDate,
  affiliateId = '',
}) => {
  const tier = normalizeBudget(budget);
  const config = BUDGET_CONFIG[tier];

  const checkIn = toYMD(startDate);
  const checkOut = toYMD(endDate);
  const rawSearchArea = areaName || destination;
  const searchArea = cleanAreaName(rawSearchArea);

  const bookingUrl = [
    'https://www.booking.com/searchresults.html',
    `?aid=${affiliateId}`,
    `&ss=${encodeURIComponent(searchArea)}`,
    checkIn ? `&checkin=${checkIn}` : '',
    checkOut ? `&checkout=${checkOut}` : '',
    '&no_rooms=1&group_adults=2',
    `&nflt=${config.nflt}`,
  ].join('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_6px_24px_rgb(0,0,0,0.05)] transition-all relative overflow-hidden mt-6"
    >
      {/* Accent left border matching itinerary theme */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px]"
        style={{ backgroundColor: dayColor }}
      />

      <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        {/* Left side info block */}
        <div className="flex gap-4 items-start">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: `${dayColor}10`,
              border: `1px solid ${dayColor}20`
            }}
          >
            <BedDouble className="w-5 h-5" style={{ color: dayColor }} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Day {dayNumber} Accommodation
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200/60"
              >
                {config.label}
              </span>
            </div>

            <h4 className="text-base font-bold text-gray-900 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Stay near</span>
              <span className="text-gray-900 inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 inline" />
                {searchArea}
              </span>
            </h4>

            <p className="text-xs text-gray-500 font-medium mt-1">
              {config.stars} hotels · {config.minScore} {config.scoreLabel} score · {config.description}
            </p>
          </div>
        </div>

        {/* Right side CTA Button */}
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 px-4 py-2.5 rounded-xl transition-all border border-blue-100/50 whitespace-nowrap w-full md:w-auto justify-center"
        >
          <span>Find Hotels on Booking.com</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.div>
  );
};

export default DayHotelCard;
