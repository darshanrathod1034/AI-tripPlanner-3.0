import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { outline, skyline, world } from '../assets/assets';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { fetchMultiplePlaceImages } from '../services/unsplashService';
import { FaBookmark, FaRegBookmark, FaMapMarkerAlt, FaStar, FaPlaneDeparture } from 'react-icons/fa';
import { useAuth } from '../context/authContext';
import { motion, AnimatePresence } from 'framer-motion';

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
        await getRecommendationsFromAPI();
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setLoading(false);
    }
  };

  const getRecommendationsFromAPI = async (lat = null, lng = null) => {
    try {
      const params = lat && lng ? { lat, lng } : {};
      const response = await api.get('/users/recommendations', { params });
      
      const recs = response.data.recommendations;
      setRecommendations(recs);

      const places = [recs.local, recs.national, recs.international];
      const images = await fetchMultiplePlaceImages(places);
      setPlaceImages(images);
    } catch (error) {
      console.error("Error getting recommendations from API:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPlaces = async () => {
    try {
      const response = await api.get('/users/savedplaces', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSavedPlaces(response.data.savedPlaces || []);
    } catch (error) {
      console.error("Error fetching saved places:", error);
    }
  };

  const handleSavePlace = async (place, e) => {
    e.stopPropagation(); 
    if (!user) {
      alert("Please login to save places!");
      return;
    }
    try {
      const isAlreadySaved = savedPlaces.some(p => p.name === place.name && p.address === place.location);
      if (isAlreadySaved) {
        const savedPlace = savedPlaces.find(p => p.name === place.name && p.address === place.location);
        await api.delete(`/users/saveplace/${savedPlace._id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSavedPlaces(savedPlaces.filter(p => p._id !== savedPlace._id));
      } else {
        const response = await api.post('/users/saveplace', {
          name: place.name,
          lat: 0, 
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      <Navbar />

      {/* Aesthetic Background Motifs */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply">
        <img src={world} alt="" className="absolute -top-32 sm:-top-64 left-1/2 -translate-x-1/2 w-full max-w-[1600px] object-cover opacity-30 blur-[2px]" />
        <img src={outline} alt="" className="absolute top-[40%] w-full object-cover opacity-10" />
        <img src={skyline} alt="" className="absolute bottom-0 w-full object-cover opacity-30 blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/90 to-slate-50"></div>
      </div>

      <main className="flex-grow relative z-10 pt-32 pb-20">
        
        {/* Minimalist Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center px-4 max-w-4xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-sm tracking-wide mb-6 uppercase shadow-sm">
            <FaPlaneDeparture /> Explore The World
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight drop-shadow-sm">
            Discover Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Adventure</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            Let our AI engine analyze your preferences and global trends to recommend the perfect escape for your next holiday.
          </p>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-10">
            <Link to="/create-trip" className="inline-flex items-center justify-center bg-slate-900 hover:bg-black text-white font-black text-lg px-8 py-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all">
              + Generate New Trip
            </Link>
          </motion.div>
        </motion.div>

        {/* Dynamic Recommendation Header */}
        <motion.div 
           initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
           className="mt-32 text-center px-4"
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            {locationError ? "Popular Destinations Worldwide" : "Curated Specially For You"}
          </h2>
          <p className="mt-3 text-slate-500 font-bold uppercase tracking-widest text-sm">Based on intelligent planetary analytics</p>
        </motion.div>

        {/* Stunning Glassmorphic Cards */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-12 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="rounded-[2.5rem] bg-white shadow-xl h-[450px] animate-pulse ring-1 ring-slate-100"></div>
              ))
            ) : recommendations ? (
              [
                { ...recommendations.local, badge: "📍 Near You" },
                { ...recommendations.national, badge: "🏆 Top Pick" },
                { ...recommendations.international, badge: "✈️ Explore" },
              ].map((place, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  key={i} 
                  className="group relative rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] transition-all bg-white"
                >
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
                  
                  <img
                    src={placeImages[place.name] || `https://source.unsplash.com/800x800/?${encodeURIComponent(place.name)},travel`}
                    alt={place.name}
                    className="w-full h-[450px] object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    onError={(e) => { e.target.src = `https://source.unsplash.com/800x800/?travel,${encodeURIComponent(place.name)}`; }}
                  />
                  
                  {/* Badge */}
                  <div className="absolute top-6 left-6 z-20">
                    <span className="bg-white/90 backdrop-blur-md text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full text-slate-800 shadow-xl">
                      {place.badge}
                    </span>
                  </div>

                  {/* Save Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleSavePlace(place, e)}
                    className="absolute top-6 right-6 z-30 bg-white/20 backdrop-blur-xl p-3.5 rounded-full border border-white/30 transition-all text-white shadow-xl hover:bg-white hover:text-blue-600 focus:outline-none"
                    title="Save Place"
                  >
                    {user && savedPlaces.some(p => p.name === place.name && p.address === place.location) ? (
                      <FaBookmark className="text-blue-400" size={20} />
                    ) : (
                      <FaRegBookmark size={20} />
                    )}
                  </motion.button>

                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-3xl font-black text-white leading-tight drop-shadow-md">{place.name}</h3>
                    <p className="flex items-center gap-2 text-slate-200 font-bold mt-2 drop-shadow-sm">
                       <FaMapMarkerAlt className="text-blue-400" /> {place.location}
                    </p>
                    
                    <div className="flex items-start gap-4 mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {place.rating && (
                        <div className="flex flex-shrink-0 items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                          <FaStar className="text-yellow-400 mr-1" size={14} />
                          <span className="text-sm font-black text-white">{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <p className="text-sm text-slate-200 font-medium leading-snug line-clamp-3">
                        {place.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;