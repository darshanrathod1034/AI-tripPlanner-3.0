import { useAuth } from '../context/authContext';
import api from '../services/api';
import HotelCard from './HotelCard';
import { cleanAreaName } from './DayHotelCard';
import { ExternalLink, BedDouble } from 'lucide-react';

/**
 * HotelResultsSection — displays hotel recommendation cards below the itinerary.
 *
 * Props:
 *   hotels      — array of hotel objects
 *   loading     — bool
 *   destination — string
 *   startDate   — string (YYYY-MM-DD)
 *   endDate     — string (YYYY-MM-DD)
 *   affiliateId — string (Booking.com affiliate ID for fallback deeplink)
 */
const HotelResultsSection = ({
  hotels = [],
  loading,
  destination,
  startDate,
  endDate,
  affiliateId,
}) => {
  const { user } = useAuth();

  // Fire-and-forget click tracking
  const handleTrackClick = ({ hotelId, destination: dest }) => {
    const token = user?.token;
    api
      .post(
        '/hotels/track-click',
        {
          destination: dest,
          hotelId: hotelId ?? null,
          sessionId: Date.now().toString(),
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      )
      .catch(() => {});
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="mt-10">
        <div className="h-8 w-48 animate-pulse bg-slate-200 rounded-xl mb-6" />
        <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 md:w-auto snap-start animate-pulse bg-slate-200 rounded-2xl h-48"
            />
          ))}
        </div>
      </section>
    );
  }

  const cleanDest = cleanAreaName(destination);
  const fallbackUrl = `https://www.booking.com/searchresults.html?aid=${affiliateId || ''}&ss=${encodeURIComponent(
    cleanDest || destination || ''
  )}&checkin=${startDate || ''}&checkout=${endDate || ''}`;

  // ── Empty / error state ───────────────────────────────────────────────────
  if (!loading && hotels.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
          <BedDouble className="text-blue-600 w-6 h-6" />
          <span>Book Stays in {cleanDest || destination}</span>
        </h2>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6 text-center max-w-2xl mx-auto">
          <p className="text-slate-600 text-sm mb-5 leading-relaxed font-medium">
            You can search and book hotels manually in {cleanDest || destination} according to your preferences. Find accommodations that align with your budget and style.
          </p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl border border-blue-100 transition-colors"
          >
            <span>Search Hotels on Booking.com</span>
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </a>
        </div>
      </section>
    );
  }

  // ── Normal state ──────────────────────────────────────────────────────────
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
        <BedDouble className="text-blue-600 w-6 h-6" />
        <span>Full-Trip Hotel Search</span>
      </h2>

      <div className="flex overflow-x-auto gap-4 pb-4 snap-x md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
        {hotels.map((hotel, idx) => (
          <div key={hotel.propertyId || idx} className="flex-shrink-0 w-72 md:w-auto snap-start">
            <HotelCard
              hotel={hotel}
              destination={destination}
              startDate={startDate}
              endDate={endDate}
              onTrackClick={handleTrackClick}
            />
          </div>
        ))}
      </div>

      {/* Sleek Manual Booking Escape Hatch */}
      <div className="mt-8 bg-slate-50 rounded-2xl p-5 border border-slate-100/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Prefer to book manually?</h4>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            You can search and book hotels manually in {cleanDest || destination} according to your own preferences.
          </p>
        </div>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 px-4 py-2.5 rounded-xl border border-blue-100/50 whitespace-nowrap w-full sm:w-auto justify-center transition-all"
        >
          <span>Custom Search on Booking.com</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
};

export default HotelResultsSection;
