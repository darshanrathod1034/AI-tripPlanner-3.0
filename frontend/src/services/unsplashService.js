import axios from 'axios';

const UNSPLASH_API = 'https://api.unsplash.com/photos/random';
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
// After 5 consecutive failures, stop making Unsplash API requests for 5 minutes.
// State is module-level so it persists across all components for the session.
const circuit = {
  failures: 0,
  maxFailures: 5,
  openUntil: null,   // timestamp when circuit resets

  isOpen() {
    if (this.openUntil && Date.now() < this.openUntil) return true;
    if (this.openUntil && Date.now() >= this.openUntil) {
      // Reset after cooldown
      this.failures = 0;
      this.openUntil = null;
    }
    return false;
  },

  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.maxFailures) {
      this.openUntil = Date.now() + 5 * 60 * 1000; // 5 min cooldown
      console.warn(`⚡ Unsplash circuit breaker OPEN — too many failures. Pausing requests for 5 minutes.`);
    }
  },

  recordSuccess() {
    this.failures = 0;
    this.openUntil = null;
  },
};

// ─── Fallback Images ──────────────────────────────────────────────────────────
const FALLBACKS = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
];

function getFallback(seed = '') {
  // Deterministic fallback based on seed so the same place always gets the same image
  const idx = seed.length % FALLBACKS.length;
  return FALLBACKS[idx];
}

// ─── Core Fetch ───────────────────────────────────────────────────────────────
/**
 * Fetch a random image for a place from Unsplash.
 * Respects the circuit breaker — returns a fallback immediately if circuit is open.
 */
export const fetchPlaceImage = async (placeName, query = '') => {
  // Circuit open — skip the request entirely
  if (circuit.isOpen()) {
    return getFallback(placeName);
  }

  try {
    const searchQuery = query ? `${placeName} ${query}` : `${placeName} travel destination`;

    const response = await axios.get(UNSPLASH_API, {
      params: {
        query: searchQuery,
        orientation: 'landscape',
        client_id: UNSPLASH_ACCESS_KEY,
      },
      timeout: 8000, // don't hang forever
    });

    circuit.recordSuccess();
    return response.data.urls.regular || response.data.urls.full;
  } catch (error) {
    circuit.recordFailure();
    console.error(`Unsplash fetch failed for "${placeName}" (failures: ${circuit.failures}):`, error.message);
    return getFallback(placeName);
  }
};

/**
 * Fetch multiple place images in parallel.
 * Respects the circuit breaker — if circuit is open, all return fallbacks immediately.
 */
export const fetchMultiplePlaceImages = async (places) => {
  if (!places?.length) return {};

  // If circuit is open, return all fallbacks without any network calls
  if (circuit.isOpen()) {
    const imageMap = {};
    places.forEach(place => { imageMap[place.name] = getFallback(place.name); });
    return imageMap;
  }

  const imagePromises = places.map(place =>
    fetchPlaceImage(place.name, place.category || '')
  );

  const images = await Promise.all(imagePromises);

  const imageMap = {};
  places.forEach((place, index) => {
    imageMap[place.name] = images[index];
  });

  return imageMap;
};

/**
 * Expose circuit state for debugging (e.g. in dev tools)
 */
export const getCircuitState = () => ({
  failures: circuit.failures,
  isOpen: circuit.isOpen(),
  opensUntil: circuit.openUntil ? new Date(circuit.openUntil).toISOString() : null,
});
