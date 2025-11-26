import axios from 'axios';

const UNSPLASH_API = 'https://api.unsplash.com/photos/random';
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

/**
 * Fetch a random image for a place from Unsplash
 * @param {string} placeName - Name of the place
 * @param {string} query - Additional search query (optional)
 * @returns {Promise<string>} - URL of the image
 */
export const fetchPlaceImage = async (placeName, query = '') => {
    try {
        const searchQuery = query ? `${placeName} ${query}` : `${placeName} travel destination`;

        const response = await axios.get(UNSPLASH_API, {
            params: {
                query: searchQuery,
                orientation: 'landscape',
                client_id: UNSPLASH_ACCESS_KEY,
            },
        });

        return response.data.urls.regular || response.data.urls.full;
    } catch (error) {
        console.error(`Error fetching image for ${placeName}:`, error.message);
        // Fallback to Unsplash Source API
        return `https://source.unsplash.com/1600x900/?${encodeURIComponent(placeName)},travel`;
    }
};

/**
 * Fetch multiple place images in parallel
 * @param {Array<{name: string, category: string}>} places - Array of place objects
 * @returns {Promise<Object>} - Object with place names as keys and image URLs as values
 */
export const fetchMultiplePlaceImages = async (places) => {
    try {
        const imagePromises = places.map(place =>
            fetchPlaceImage(place.name, place.category)
        );

        const images = await Promise.all(imagePromises);

        const imageMap = {};
        places.forEach((place, index) => {
            imageMap[place.name] = images[index];
        });

        return imageMap;
    } catch (error) {
        console.error('Error fetching multiple images:', error.message);
        return {};
    }
};
