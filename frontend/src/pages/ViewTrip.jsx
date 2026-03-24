import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import axios from "axios";
import api from "../services/api";
import { FaBookmark, FaRegBookmark, FaRoute, FaMapMarkerAlt, FaRegCalendarAlt, FaWallet, FaStar } from "react-icons/fa";
import { useAuth } from "../context/authContext";
import { motion, AnimatePresence } from "framer-motion";

// Custom hook to load Google Maps
const useLoadGoogleMaps = (apiKey) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, [apiKey]);

  return loaded;
};

// Elegant Day Colors matching Tailwind Palette
const dayColors = [
  "#ef4444", // Red-500
  "#3b82f6", // Blue-500
  "#10b981", // Emerald-500
  "#f59e0b", // Amber-500
  "#8b5cf6", // Violet-500
  "#06b6d4", // Cyan-500
];

const ViewTrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId } = useParams();
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [error, setError] = useState(null);

  const [activeMarker, setActiveMarker] = useState(null);
  const [map, setMap] = useState(null);

  const [destinationImage, setDestinationImage] = useState("");
  const [placeImages, setPlaceImages] = useState({});
  const [savedPlaces, setSavedPlaces] = useState([]);

  const [loading, setLoading] = useState({
    destinationImage: true,
    placeImages: true,
  });

  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isGoogleMapsLoaded = useLoadGoogleMaps(googleMapsApiKey);

  const fetchSavedPlaces = async () => {
    if (!user) return;
    try {
      const response = await api.get(
        "/users/savedplaces",
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSavedPlaces(response.data.savedPlaces || []);
    } catch (error) {
      console.error("Error fetching saved places:", error);
    }
  };

  const handleSavePlace = async (place) => {
    if (!user) {
      alert("Please login to save places!");
      return;
    }
    try {
      const isAlreadySaved = savedPlaces.some(p => p.name === place.name);
      if (isAlreadySaved) {
        const savedPlace = savedPlaces.find(p => p.name === place.name);
        await api.delete(
          `/users/saveplace/${savedPlace._id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setSavedPlaces(savedPlaces.filter(p => p._id !== savedPlace._id));
      } else {
        const response = await api.post(
          "/users/saveplace",
          {
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            rating: place.rating || 0,
            address: place.address,
            types: place.types || []
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setSavedPlaces([...savedPlaces, response.data.place]);
      }
    } catch (error) {
      console.error("Error saving place:", error);
    }
  };

  const fetchDestinationImage = async (destination) => {
    try {
      setLoading(prev => ({ ...prev, destinationImage: true }));
      const response = await axios.get(
        `https://api.unsplash.com/photos/random`,
        {
          params: { query: `${destination} landmark city landscape`, orientation: "landscape", client_id: unsplashAccessKey },
        }
      );
      setDestinationImage(response.data.urls.regular);
    } catch (error) {
      setDestinationImage(`https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80`);
    } finally {
      setLoading(prev => ({ ...prev, destinationImage: false }));
    }
  };

  const fetchPlaceImages = async () => {
    const images = {};
    try {
      setLoading(prev => ({ ...prev, placeImages: true }));
      for (const dayPlan of recommendations) {
        for (const place of dayPlan.places) {
          try {
            const response = await axios.get("https://api.unsplash.com/photos/random", {
              params: { query: `${place.name} ${tripDetails.destination}`, client_id: unsplashAccessKey },
            });
            images[place.name] = response.data.urls.small;
          } catch {
            images[place.name] = `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60`;
          }
        }
      }
    } finally {
      setPlaceImages(images);
      setLoading(prev => ({ ...prev, placeImages: false }));
    }
  };

  const fetchTripById = async (id) => {
    try {
      const response = await api.get(
        `/users/mytrip/${id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const trip = response.data.trip;
      setRecommendations(trip.itinerary);
      setTripDetails({
        destination: trip.destination,
        budget: trip.budget,
        interests: trip.preferences || []
      });
      fetchDestinationImage(trip.destination);
      fetchSavedPlaces();
    } catch (error) {
      console.error("Error fetching trip:", error);
      setError("Failed to load trip. Please try again.");
    }
  };

  useEffect(() => {
    if (location.state) {
      setRecommendations(location.state.itinerary);
      setTripDetails(location.state.tripDetails);
      fetchDestinationImage(location.state.tripDetails.destination);
      fetchSavedPlaces();
    } else if (tripId && user) {
      fetchTripById(tripId);
    } else if (!tripId) {
      setError("No trip data found. Please generate a new trip.");
    }
  }, [location.state, tripId, user]);

  useEffect(() => {
    if (recommendations && tripDetails) {
      fetchPlaceImages();
    }
  }, [recommendations, tripDetails]);

  const handleMarkerClick = (marker) => setActiveMarker(marker);
  const handleMapLoad = (map) => setMap(map);

  const handleDayClick = (dayNumber) => {
    const dayPlaces = allPlaces.filter(p => p.day === dayNumber);
    if (!map || dayPlaces.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    dayPlaces.forEach(p => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
    map.fitBounds(bounds);
    if (map.getZoom() > 15) map.setZoom(15);
  };

  const openGoogleMaps = (lat, lng) =>
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-32">
        <Navbar />
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-xl font-bold text-gray-800 mb-6">{error}</p>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 rounded-xl"
            onClick={() => navigate("/create-trip")}
          >
            Create New Trip
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations || !tripDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Navbar />
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-bold text-gray-500">Unpacking your itinerary...</p>
        </div>
      </div>
    );
  }

  const allPlaces = recommendations.flatMap((dayPlan) =>
    dayPlan.places.map((place) => ({ ...place, day: dayPlan.day }))
  );

  const mapCenter = allPlaces.length
    ? { lat: allPlaces[0].lat, lng: allPlaces[0].lng }
    : { lat: 0, lng: 0 };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans pt-16">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: SCROLLING ITINERARY */}
        <div className="w-full lg:w-[55%] xl:w-1/2 overflow-y-auto no-scrollbar scroll-smooth">
          
          {/* Panoramic Hero Header */}
          <div className="relative h-72 md:h-96 w-full rounded-b-[3rem] overflow-hidden shadow-2xl">
            {loading.destinationImage ? (
              <div className="w-full h-full bg-slate-200 animate-pulse"></div>
            ) : (
              <img
                src={destinationImage}
                alt={tripDetails.destination}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-8 sm:p-12">
              <motion.span 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold uppercase tracking-widest w-fit mb-4"
              >
                Your Generated Trip
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg"
              >
                {tripDetails.destination}
              </motion.h1>
            </div>
          </div>

          {/* Scrolling Content Padding */}
          <div className="px-6 py-8 md:px-12 max-w-3xl mx-auto">
            
            {/* Glassmorphic Trip Summary Row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm ring-1 ring-gray-900/5 -mt-16 relative z-10 mb-10 flex flex-wrap gap-6 justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <FaWallet size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Budget</p>
                  <p className="text-lg font-black text-gray-900 capitalize">{tripDetails.budget}</p>
                </div>
              </div>
              
              {tripDetails.interests && tripDetails.interests.length > 0 && (
                <>
                  <div className="h-10 w-[1px] bg-gray-200 hidden sm:block"></div>

                  <div className="flex flex-1 items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <FaRoute size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {tripDetails.interests.map((i, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <FaRegCalendarAlt className="text-blue-600" />
                Itinerary
              </h2>

              {/* Vertical Animated Timeline */}
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-12">
                {recommendations.map((dayPlan, index) => {
                  const dayColor = dayColors[(dayPlan.day - 1) % dayColors.length];
                  return (
                    <motion.div 
                      variants={itemVariants} 
                      key={index} 
                      className="relative pl-8"
                    >
                      {/* Timeline Dot */}
                      <div 
                        className="absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-slate-50 flex items-center justify-center text-white font-black text-sm shadow-md cursor-pointer transition-transform hover:scale-110"
                        style={{ backgroundColor: dayColor }}
                        onClick={() => handleDayClick(dayPlan.day)}
                      >
                        {dayPlan.day}
                      </div>

                      <div className="flex items-center justify-between mb-6 cursor-pointer group" onClick={() => handleDayClick(dayPlan.day)}>
                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                          Day {dayPlan.day}
                        </h3>
                        <span className="text-sm font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          Focus on Map &rarr;
                        </span>
                      </div>

                      {/* Places List within the Day */}
                      <div className="space-y-5">
                        {dayPlan.places.map((place, idx) => (
                          <div 
                            key={idx} 
                            className="group bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col sm:flex-row gap-5 relative overflow-hidden"
                          >
                            {/* Hover Color Trim */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: dayColor }}></div>

                            {/* Place Image */}
                            <div className="relative w-full sm:w-32 h-40 sm:h-32 rounded-xl overflow-hidden flex-shrink-0">
                              {placeImages[place.name] ? (
                                <img
                                  src={placeImages[place.name]}
                                  alt={place.name}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 animate-pulse"></div>
                              )}
                              {place.rating && (
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 text-white text-xs font-bold">
                                  <FaStar className="text-yellow-400" /> {place.rating}
                                </div>
                              )}
                            </div>

                            {/* Place Details */}
                            <div className="flex-grow flex flex-col justify-between py-1">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{place.name}</h4>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed mt-2 line-clamp-2">
                                  {place.address}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 mt-4">
                                <button
                                  onClick={() => openGoogleMaps(place.lat, place.lng)}
                                  className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
                                >
                                  <FaMapMarkerAlt /> View Map
                                </button>

                                <button
                                  onClick={() => handleSavePlace(place)}
                                  className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                                    savedPlaces.some(p => p.name === place.name) 
                                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
                                  }`}
                                >
                                  {savedPlaces.some(p => p.name === place.name) ? (
                                    <><FaBookmark /> Saved</>
                                  ) : (
                                    <><FaRegBookmark /> Save</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 mb-8">
              <button
                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl transition-all"
                onClick={() => navigate("/")}
              >
                Return Home
              </button>
            </motion.div>

          </div>
        </div>


        {/* RIGHT PANEL: MAP INTEGRATION */}
        <div className="hidden lg:block lg:w-[45%] xl:w-1/2 p-6 h-screen sticky top-0">
          <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-gray-900/5 relative bg-white">
            {isGoogleMapsLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={12}
                onLoad={handleMapLoad}
                options={{
                  zoomControl: true,
                  mapTypeControl: false,
                  streetViewControl: false,
                  styles: [
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                  ] // Cleaner map aesthetic
                }}
              >
                {allPlaces.map((place, idx) => (
                  <Marker
                    key={idx}
                    position={{ lat: place.lat, lng: place.lng }}
                    onClick={() => handleMarkerClick(place)}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: dayColors[(place.day - 1) % dayColors.length],
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                    }}
                  />
                ))}

                {activeMarker && (
                  <InfoWindow
                    position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                    onCloseClick={() => setActiveMarker(null)}
                  >
                    <div className="p-2 max-w-[200px]">
                      <h4 className="font-bold text-gray-900 mb-1">{activeMarker.name}</h4>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                         Day {activeMarker.day}
                      </p>
                      <button
                        onClick={() => openGoogleMaps(activeMarker.lat, activeMarker.lng)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-md transition-colors"
                      >
                        Open Maps
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 animate-pulse">
                <FaMapMarkerAlt className="text-4xl text-gray-300 mb-4" />
                <p className="font-bold text-gray-400">Loading Map Terrain...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ViewTrip;
