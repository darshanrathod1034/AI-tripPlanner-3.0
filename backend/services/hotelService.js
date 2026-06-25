import HotelCache from '../models/hotelCache-model.js';

// Read affiliate ID on module load
const AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || '';

if (!AFFILIATE_ID) {
  console.warn('⚠️ BOOKING_AFFILIATE_ID is not set — hotel deeplinks will be broken');
}

/**
 * Convert a Date object or ISO string to a YYYY-MM-DD string.
 * @param {Date|string} d
 * @returns {string}
 */
function toYMD(d) {
  const dt = new Date(d);
  return dt.toISOString().split('T')[0];
}

/**
 * Build a Booking.com search deeplink for the given destination and dates.
 * Gracefully degrades (empty aid) if AFFILIATE_ID is not set.
 * @param {string} destination
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {string}
 */
export function buildDeeplink(destination, startDate, endDate) {
  const encodedDest = encodeURIComponent(destination);
  const start = toYMD(startDate);
  const end = toYMD(endDate);

  return `https://www.booking.com/searchresults.html?aid=${AFFILIATE_ID}&ss=${encodedDest}&checkin=${start}&checkout=${end}&no_rooms=1&group_adults=2`;
}

/**
 * Fetch hotels for a destination and date range.
 * Returns cached results if available (TTL: 6 hours via MongoDB TTL index).
 * On cache miss, builds a deeplink-only result and saves it to cache.
 * Wraps everything in an 8-second timeout.
 *
 * @param {string} destination
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {Promise<Array>} array of hotel result objects
 */
export async function getHotels(destination, startDate, endDate) {
  const start = toYMD(startDate);
  const end = toYMD(endDate);
  const cacheKey = `${destination.toLowerCase().trim()}::${start}::${end}`;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject({ code: 'HOTEL_TIMEOUT', message: 'Hotel fetch timed out' }),
      8000
    )
  );

  const fetchPromise = (async () => {
    // Cache hit
    const cached = await HotelCache.findOne({ cacheKey });
    if (cached) {
      return cached.hotels;
    }

    // Cache miss — build deeplink-only result
    const result = [
      {
        type: 'deeplink',
        destination,
        startDate: start,
        endDate: end,
        bookingUrl: buildDeeplink(destination, startDate, endDate),
      },
    ];

    // Only write to cache if we have results
    if (result.length > 0) {
      await HotelCache.create({
        cacheKey,
        destination,
        startDate: start,
        endDate: end,
        hotels: result,
        cachedAt: new Date(),
      });
    }

    return result;
  })();

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.error(
      `❌ Hotel fetch error for ${destination} at ${new Date().toISOString()}: ${err.message}`
    );
    throw err;
  }
}
