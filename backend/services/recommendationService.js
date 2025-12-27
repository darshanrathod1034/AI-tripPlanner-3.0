import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GOOGLE_GEOCODE_API = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_TEXT_SEARCH_API = "https://maps.googleapis.com/maps/api/place/textsearch/json";

/**
 * Get location details (city, state, country) from lat/lng coordinates
 */
export const getCoordinatesFromLatLng = async (lat, lng) => {
    try {
        const response = await axios.get(GOOGLE_GEOCODE_API, {
            params: {
                latlng: `${lat},${lng}`,
                key: process.env.GOOGLE_API_KEY,
            },
        });

        if (response.data.status !== "OK") return null;

        const addressComponents = response.data.results[0].address_components;
        let city = "";
        let state = "";
        let country = "";

        addressComponents.forEach((component) => {
            if (component.types.includes("locality")) {
                city = component.long_name;
            }
            if (component.types.includes("administrative_area_level_1")) {
                state = component.long_name;
            }
            if (component.types.includes("country")) {
                country = component.long_name;
            }
        });

        return { city, state, country, lat, lng };
    } catch (error) {
        console.error("Error getting location from coordinates:", error.message);
        return null;
    }
};

/**
 * Get a trending/popular place in the user's state
 */
export const getLocalRecommendation = async (state, country) => {
    try {
        const response = await axios.get(GOOGLE_TEXT_SEARCH_API, {
            params: {
                query: `trending tourist attractions in ${state} ${country}`,
                key: process.env.GOOGLE_API_KEY,
            },
        });

        if (response.data.status !== "OK" || response.data.results.length === 0) {
            return null;
        }

        // Get the top-rated place
        const places = response.data.results
            .filter((place) => place.rating && place.rating >= 4.0)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        if (places.length === 0) return null;

        const topPlace = places[0];
        return {
            name: topPlace.name,
            location: topPlace.formatted_address || state,
            rating: topPlace.rating || 0,
            category: "local",
            description: `Trending in ${state}`,
        };
    } catch (error) {
        console.error("Error getting local recommendation:", error.message);
        return null;
    }
};

/**
 * Get a popular destination in the user's country
 */
export const getNationalRecommendation = async (country) => {
    try {
        const response = await axios.get(GOOGLE_TEXT_SEARCH_API, {
            params: {
                query: `must visit tourist places in ${country}`,
                key: process.env.GOOGLE_API_KEY,
            },
        });

        if (response.data.status !== "OK" || response.data.results.length === 0) {
            return null;
        }

        // Get highly rated places
        const places = response.data.results
            .filter((place) => place.rating && place.rating >= 4.2)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        if (places.length === 0) return null;

        const topPlace = places[0];
        return {
            name: topPlace.name,
            location: topPlace.formatted_address || country,
            rating: topPlace.rating || 0,
            category: "national",
            description: `Popular in ${country}`,
        };
    } catch (error) {
        console.error("Error getting national recommendation:", error.message);
        return null;
    }
};

/**
 * Get a globally popular destination
 */
export const getInternationalRecommendation = async () => {
    try {
        // Popular international destinations
        const destinations = [
            "Paris",
            "Tokyo",
            "New York",
            "Dubai",
            "London",
            "Barcelona",
            "Rome",
            "Bali",
            "Maldives",
            "Singapore",
        ];

        // Pick a random destination
        
        const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];

        const response = await axios.get(GOOGLE_TEXT_SEARCH_API, {
            params: {
                query: `${randomDestination} tourist attractions`,
                key: process.env.GOOGLE_API_KEY,
            },
        });

        if (response.data.status !== "OK" || response.data.results.length === 0) {
            return null;
        }

        const topPlace = response.data.results[0];
        return {
            name: randomDestination,
            location: topPlace.formatted_address || randomDestination,
            rating: topPlace.rating || 4.5,
            category: "international",
            description: "Global hotspot",
        };
    } catch (error) {
        console.error("Error getting international recommendation:", error.message);
        return null;
    }
};

/**
 * Get all three recommendations based on user location
 */
export const getRecommendations = async (lat, lng) => {
    try {
        let location = null;

        // If lat/lng provided, get location details
        if (lat && lng) {
            location = await getCoordinatesFromLatLng(lat, lng);
        }

        // Fallback: use global defaults if no location
        const state = location?.state || "California";
        const country = location?.country || "United States";

        // Fetch all three recommendations in parallel
        const [local, national, international] = await Promise.all([
            getLocalRecommendation(state, country),
            getNationalRecommendation(country),
            getInternationalRecommendation(),
        ]);

        return {
            local: local || {
                name: "Local Discovery",
                location: state,
                rating: 4.0,
                category: "local",
                description: "Explore nearby",
            },
            national: national || {
                name: "National Gem",
                location: country,
                rating: 4.2,
                category: "national",
                description: "Discover your country",
            },
            international: international || {
                name: "Paris",
                location: "France",
                rating: 4.8,
                category: "international",
                description: "Global hotspot",
            },
        };
    } catch (error) {
        console.error("Error getting recommendations:", error.message);
        // Return fallback recommendations
        return {
            local: { name: "Local Discovery", location: "Near you", rating: 4.0, category: "local", description: "Explore nearby" },
            national: { name: "National Gem", location: "Your country", rating: 4.2, category: "national", description: "Discover your country" },
            international: { name: "Paris", location: "France", rating: 4.8, category: "international", description: "Global hotspot" },
        };
    }
};
