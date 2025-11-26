import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import { outline, skyline, world } from '../assets/assets';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { fetchMultiplePlaceImages } from '../services/unsplashService';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { useAuth } from '../context/authContext';

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [placeImages, setPlaceImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendations();
    if (user) {
      fetchSavedPlaces();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await getRecommendationsFromAPI(latitude, longitude);
          },
          async (error) => {
            console.warn("Location permission denied,using fallback:", error);
            setLocationError(true);
            await getRecommendationsFromAPI();
          }
        );
      } else {
        // Browser doesn't support geolocation
        await getRecommendationsFromAPI();
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setLoading(false);
    }
  };

  const getRecommendationsFromAPI = async (lat = null, lng = null) => {
    console.log("🔍 Frontend: Getting recommendations with params:", { lat, lng });
    try {
      const params = lat && lng ? { lat, lng } : {};

      console.log("🌐 Frontend: Making API call to /users/recommendations");
      const response = await axios.get('http://localhost:5555/users/recommendations', {
        params,
      });

      console.log("📦 Frontend: API Response:", response.data);

      const recs = response.data.recommendations;
      setRecommendations(recs);
      console.log("✅ Frontend: Recommendations set:", recs);

      // Fetch images for all places
      const places = [recs.local, recs.national, recs.international];
      console.log("🖼️ Frontend: Fetching images for places:", places);
      const images = await fetchMultiplePlaceImages(places);
      setPlaceImages(images);
      console.log("✅ Frontend: Images set:", images);
    } catch (error) {
      console.error("❌ Frontend: Error getting recommendations from API:", error);
      console.error("❌ Frontend: Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      console.log("🏁 Frontend: Loading complete");
    }
  };

  const fetchSavedPlaces = async () => {
    try {
      const response = await axios.get('http://localhost:5555/users/savedplaces', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSavedPlaces(response.data.savedPlaces || []);
    } catch (error) {
      console.error("Error fetching saved places:", error);
    }
  };

  const handleSavePlace = async (place, e) => {
    e.stopPropagation(); // Prevent card click

    if (!user) {
      alert("Please login to save places!");
      return;
    }

    try {
      const isAlreadySaved = savedPlaces.some(p => p.name === place.name && p.address === place.location);

      if (isAlreadySaved) {
        // Unsave
        const savedPlace = savedPlaces.find(p => p.name === place.name && p.address === place.location);
        await axios.delete(`http://localhost:5555/users/saveplace/${savedPlace._id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSavedPlaces(savedPlaces.filter(p => p._id !== savedPlace._id));
      } else {
        // Save
        const response = await axios.post('http://localhost:5555/users/saveplace', {
          name: place.name,
          lat: 0, // We don't have lat/lng from recommendations
          lng: 0,
          rating: place.rating || 0,
          address: place.location,
          types: [place.category]
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSavedPlaces([...savedPlaces, response.data.place]);
      }
    } catch (error) {
      console.error("Error saving/unsaving place:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <div className='mt-[80px] md:mt-[120px] text-center px-4'>
          <h1 className='text-3xl md:text-5xl font-bold text-[#E79C01]'>Discover Your Next Adventure with AI</h1>
          <Link to='/create-trip'>
            <button className='mt-8 md:mt-12 px-6 py-2 md:px-8 md:py-3 bg-blue-950 text-white rounded-full hover:bg-blue-900 transition-colors'>
              + Create Trip
            </button>
          </Link>
        </div>

        {/* World Image */}
        <div className="mt-10 md:mt-20 px-4">
          <img src={world} alt="World map" className='mx-auto w-full max-w-[1200px]' />
        </div>

        {/* Top Destinations Section */}
        <div className='mt-12 md:mt-20 text-center px-4'>
          <h1 className='text-2xl md:text-4xl font-bold'>Top destinations for your next holiday</h1>
          <h3 className='p-4 text-lg md:text-xl'>
            {locationError
              ? "Popular destinations worldwide"
              : "Personalized recommendations for you"}
          </h3>
        </div>

        {/* Destination Cards */}
        <div className="relative">
          <img src={outline} className='w-full' alt="Travel outline" />
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1200px] mx-auto mt-[-150px] md:mt-[-250px] lg:mt-[-350px] relative z-10">
              {loading ? (
                // Loading Skeletons
                [1, 2, 3].map((i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden">
                    <div className="w-full h-48 sm:h-64 bg-gray-300 animate-pulse"></div>
                  </div>
                ))
              ) : recommendations ? (
                // Dynamic Recommendations
                [
                  { ...recommendations.local, badge: "📍 Near You" },
                  { ...recommendations.national, badge: "🏆 Top Pick" },
                  { ...recommendations.international, badge: "✈️ Explore" },
                ].map((place, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-shadow">
                    <img
                      src={placeImages[place.name] || `https://source.unsplash.com/800x600/?${encodeURIComponent(place.name)},travel`}
                      alt={place.name}
                      className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = `https://source.unsplash.com/800x600/?travel,destination`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-white/90 text-xs font-semibold px-3 py-1 rounded-full text-gray-800">
                        {place.badge}
                      </span>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={(e) => handleSavePlace(place, e)}
                      className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white transition-all z-10"
                      title={savedPlaces.some(p => p.name === place.name && p.address === place.location) ? "Remove from saved" : "Save place"}
                    >
                      {user && savedPlaces.some(p => p.name === place.name && p.address === place.location) ? (
                        <FaBookmark className="text-blue-600" size={18} />
                      ) : (
                        <FaRegBookmark className="text-gray-700" size={18} />
                      )}
                    </button>

                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl sm:text-2xl font-bold">{place.name}</h3>
                      <p className="text-base sm:text-lg">{place.location}</p>
                      {place.rating && (
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-400 mr-1">⭐</span>
                          <span className="text-sm">{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <p className="text-sm mt-1 opacity-90">{place.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback static content
                [1, 2, 3].map((i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden group cursor-pointer">
                    <img
                      src="https://images.unsplash.com/photo-1563492065599-3520f775eeed?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                      alt="Bangkok"
                      className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl sm:text-2xl font-bold">Bangkok,</h3>
                      <p className="text-base sm:text-lg">Thailand</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Skyline Image */}
        <div className="mt-12 md:mt-20">
          <img src={skyline} className='w-full' alt="City skyline" />
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;