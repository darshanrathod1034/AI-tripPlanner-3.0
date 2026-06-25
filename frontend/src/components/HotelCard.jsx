import { useState } from 'react';
import { BedDouble } from 'lucide-react';

/**
 * HotelCard — renders a hotel result card.
 *
 * Props:
 *   hotel        — { type: 'deeplink', destination, startDate, endDate, bookingUrl }
 *                  or { type: 'full', name, stars, reviewScore, reviewCount, minPrice,
 *                       currency, thumbnailUrl, bookingUrl, propertyId }
 *   destination  — string (city / destination name shown on deeplink card)
 *   startDate    — string (YYYY-MM-DD)
 *   endDate      — string (YYYY-MM-DD)
 *   onTrackClick — function({ hotelId, destination }) — fire-and-forget affiliate tracking
 */
const HotelCard = ({ hotel, destination, startDate, endDate, onTrackClick }) => {
  const [imgError, setImgError] = useState(false);

  // Format "2024-08-01" → "Aug 1"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dateRange =
    startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : '';

  const BUTTON_CLASS =
    'block w-full text-center mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors';

  // ── Deeplink-only card ─────────────────────────────────────────────────────
  if (hotel?.type === 'deeplink') {
    return (
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 flex flex-col">
        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <BedDouble className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{destination}</p>
            {dateRange && (
              <p className="text-sm text-slate-500 mt-0.5">{dateRange}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 flex-1">
          Find the best deals for your stay in {destination}.
        </p>

        <a
          href={hotel.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Search hotels in ${destination} on Booking.com`}
          className={BUTTON_CLASS}
          onClick={() => onTrackClick?.({ hotelId: null, destination })}
        >
          Search Hotels on Booking.com
        </a>
      </div>
    );
  }

  // ── Full hotel card (future Demand API) ────────────────────────────────────
  const { name, stars, reviewScore, reviewCount, minPrice, currency, thumbnailUrl, bookingUrl, propertyId } =
    hotel || {};

  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden flex flex-col">
      {/* Thumbnail */}
      {thumbnailUrl && !imgError ? (
        <img
          src={thumbnailUrl}
          alt={name}
          className="w-full h-40 object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-40 bg-slate-50 flex items-center justify-center text-slate-400 border-b border-slate-100">
          <BedDouble className="w-8 h-8 text-slate-400" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Name */}
        <p className="font-bold text-slate-900 text-lg mt-1 leading-snug">{name}</p>

        {/* Stars */}
        {stars > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: Math.min(stars, 5) }).map((_, i) => (
              <span key={i} className="text-amber-400 text-sm">★</span>
            ))}
          </div>
        )}

        {/* Review score + count */}
        {reviewScore != null && (
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-sm font-bold rounded-lg">
              {reviewScore}
            </span>
            {reviewCount != null && (
              <span className="text-slate-500 text-sm">{reviewCount.toLocaleString()} reviews</span>
            )}
          </div>
        )}

        {/* Price */}
        {minPrice != null && (
          <p className="text-emerald-600 font-bold mt-2 text-sm">
            From {currency || '$'}{minPrice} / night
          </p>
        )}

        {/* CTA */}
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Book ${name} on Booking.com`}
          className={BUTTON_CLASS}
          onClick={() => onTrackClick?.({ hotelId: propertyId, destination })}
        >
          Book on Booking.com
        </a>
      </div>
    </div>
  );
};

export default HotelCard;
