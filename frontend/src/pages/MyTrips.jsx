import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { FiCalendar, FiMapPin, FiDollarSign } from "react-icons/fi";
import { FaPlaneDeparture, FaSuitcaseRolling } from "react-icons/fa";
import { useAuth } from '../context/authContext';
import { motion } from "framer-motion";
import axios from "axios";

const MyTrips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripImages, setTripImages] = useState({});

  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) return;
      try {
        const response = await api.get("/users/mytrips", {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const fetchedTrips = response.data.trips.reverse(); // Newest first
        setTrips(fetchedTrips);
        
        // Parallel fetching of images to drastically speed up load time
        const imageMap = {};
        await Promise.all(
          fetchedTrips.map(async (trip) => {
            try {
              const res = await axios.get("https://api.unsplash.com/photos/random", {
                params: { query: `${trip.destination} city landmark architecture`, orientation: "landscape", client_id: unsplashAccessKey },
              });
              imageMap[trip._id] = res.data.urls.regular;
            } catch (err) {
              imageMap[trip._id] = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80`;
            }
          })
        );
        setTripImages(imageMap);

      } catch (err) {
        setError("Failed to load trips. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="flex justify-between items-center mb-12 animate-pulse">
            <div className="h-10 bg-slate-200 rounded w-48"></div>
            <div className="h-12 bg-slate-200 rounded-2xl w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-[2rem] bg-slate-200 animate-pulse h-[400px]"></div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center pt-40 px-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Oops!</h2>
            <p className="text-slate-500 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Navbar />
      
      {/* Background Decorative Element */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-24">
        
        {/* Dashboard Header */}
        <div className="flex justify-between items-end mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2 block">Your Dashboard</span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Saved Trips</h1>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/create-trip")}
            className="hidden sm:flex bg-blue-600 text-white px-6 py-3.5 rounded-2xl hover:bg-blue-700 font-bold items-center shadow-[0_8px_20px_rgb(59,130,246,0.3)] transition-all"
          >
            <FaPlaneDeparture className="mr-2" /> New Trip
          </motion.button>
        </div>

        {trips.length === 0 ? (
          /* Empty State Polish */
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center px-4"
          >
            <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-4xl mb-6">
              <FaSuitcaseRolling />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">No trips generated yet</h2>
            <p className="text-lg text-slate-500 mb-8 max-w-md">Your dashboard is looking a little empty. Let AI craft your perfect holiday itinerary right now!</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/create-trip")}
              className="bg-slate-900 text-white font-black text-lg px-8 py-4 rounded-2xl hover:bg-black shadow-xl"
            >
              Create Your First Trip
            </motion.button>
          </motion.div>
        ) : (
          /* Gallery Grid */
          <motion.div 
            variants={containerVariants} initial="hidden" animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
          >
            {trips.map((trip) => (
              <motion.div
                variants={itemVariants}
                key={trip._id}
                className="group relative h-[400px] rounded-[2rem] overflow-hidden cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all bg-slate-200"
                onClick={() => navigate(`/trips/${trip._id}`)}
              >
                {/* Image Background */}
                <div className="absolute inset-0 z-0">
                  {tripImages[trip._id] ? (
                    <img src={tripImages[trip._id]} alt={trip.destination} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse"></div>
                  )}
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>

                {/* Status Badge */}
                <div className="absolute top-5 left-5 z-20">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20
                    ${trip.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' 
                    : trip.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' 
                    : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {trip.status || "Planned"}
                  </span>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end h-full">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h2 className="text-3xl font-black text-white leading-tight drop-shadow-md mb-3">{trip.destination}</h2>
                    
                    {/* Glassmorphic Stats Row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="flex items-center text-xs font-bold bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10">
                        <FiCalendar className="mr-1.5" />
                        {formatDate(trip.startDate)}
                      </div>
                      <div className="flex items-center text-xs font-bold bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10 capitalize">
                        <FiDollarSign className="mr-1 mt-[1px]" />
                        {trip.budget}
                      </div>
                      <div className="flex items-center text-xs font-bold bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10">
                        <FiMapPin className="mr-1.5" />
                        {trip.itinerary?.length || 0} Days
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {trip.preferences && trip.preferences.slice(0,3).map((interest, index) => (
                          <span key={index} className="text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-500 rounded px-2 py-0.5">
                            {interest}
                          </span>
                        ))}
                        {trip.preferences?.length > 3 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-500 rounded px-2 py-0.5">
                            +{trip.preferences.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mobile Floating Action Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/create-trip")}
          className="sm:hidden fixed bottom-6 right-6 z-50 bg-slate-900 text-white w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-center text-2xl font-light"
        >
          +
        </motion.button>
      </div>
      <Footer />
    </div>
  );
};

export default MyTrips;