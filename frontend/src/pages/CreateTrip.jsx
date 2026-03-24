import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Navbar from "../components/Navbar";
import axios from "axios";
import api from "../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Background from "../components/Background";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import animationData from "../assets/plane-loading.json";
import {
  MapPin, Calendar, Wallet, Gem, Banknote,
  Palmtree, Landmark, Martini, ShoppingBag, Gamepad2,
  ChevronRight, Search, Sparkles
} from "lucide-react";

const budgetMap = {
  'cheap': 1000,
  'moderate': 2500,
  'luxury': 4000
};

const CreateTrip = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    destination: "",
    budget: "",
    interests: [],
    startDate: null,
    endDate: null
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  useEffect(() => {
    if (!isTypingLocation) return;
    const delayDebounce = setTimeout(() => {
      if (formData.destination.length > 2) {
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${formData.destination}`)
          .then((response) => setSuggestions(response.data))
          .catch((error) => console.error("Error fetching location data:", error));
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [formData.destination, isTypingLocation]);

  const handleGenerateTrip = async () => {
    if (!user?.token) {
      setError("Please log in to create a trip");
      navigate("/login");
      return;
    }

    if (!formData.destination || !formData.startDate || !formData.endDate || !formData.budget) {
      setError("Please fill in all required fields to proceed.");
      return;
    }

    setIsLoading(true);
    setShowLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/ai/recommend",
        {
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
          budget: budgetMap[formData.budget],
          preferences: formData.interests,
        },
        { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data?.success) {
        navigate("/view-trip", {
          state: {
            itinerary: response.data.recommendations,
            tripDetails: { ...formData, numericalBudget: budgetMap[formData.budget] }
          }
        });
      } else {
        throw new Error(response.data?.message || "Failed to create trip");
      }
    } catch (error) {
      console.error("Trip creation error:", error);
      if (error.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        logout();
        navigate("/login");
      } else {
        setError(error.response?.data?.message || error.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
      setShowLoading(false);
    }
  };

  const budgetOptions = [
    { id: "cheap", label: "Budget Friendly", range: "~$1000", icon: <Wallet className="w-8 h-8 text-green-500" /> },
    { id: "moderate", label: "Moderate", range: "~$2500", icon: <Banknote className="w-8 h-8 text-blue-500" /> },
    { id: "luxury", label: "Luxury", range: "~$4000", icon: <Gem className="w-8 h-8 text-purple-500" /> },
  ];

  const interestOptions = [
    { id: "nature", label: "Nature", icon: <Palmtree className="w-5 h-5" /> },
    { id: "history", label: "History", icon: <Landmark className="w-5 h-5" /> },
    { id: "nightlife", label: "Nightlife", icon: <Martini className="w-5 h-5" /> },
    { id: "shopping", label: "Shopping", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "entertainment", label: "Entertainment", icon: <Gamepad2 className="w-5 h-5" /> }
  ];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } };

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      <Navbar />

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <Background />
        <div className="absolute top-0 w-full h-full bg-gradient-to-b from-white/40 to-slate-50/90 mix-blend-overlay"></div>
      </div>

      {/* Full-Screen Loading Overlay */}
      <AnimatePresence>
        {showLoading && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 bg-slate-900/60 z-50 flex flex-col items-center justify-center shadow-2xl"
          >
            <div className="w-64 h-64 drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]">
              <Lottie animationData={animationData} loop={true} />
            </div>
            <motion.h2
              className="text-white text-3xl font-black mt-4 tracking-tight drop-shadow-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Building your <span className="text-blue-400">masterpiece...</span>
            </motion.h2>
            <motion.p
              className="text-blue-200 mt-2 font-medium"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            >
              Curating destinations & crunching numbers
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6">
        <motion.div
          initial="hidden" animate="visible" variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4">
              Design Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Perfect Journey</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 font-medium max-w-2xl mx-auto">
              Share your vision, and our intelligent AI will architect an optimized itinerary tailored down to the hour.
            </p>
          </motion.div>

          {/* Form Glass Container */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-gray-900/5"
          >
            <div className="p-8 sm:p-12 space-y-12 block">

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3 font-semibold shadow-sm"
                  >
                    <span className="text-xl">⚠️</span> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Destination Search Command Bar */}
              <section className="relative group z-[60]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-sm"><MapPin size={20} /></span>
                    Where are you traveling to?
                  </h2>
                </div>
                <div className="relative z-50">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={22} />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-6 py-5 bg-white border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg font-medium text-gray-900 placeholder-gray-400 shadow-sm hover:border-gray-300 outline-none block"
                    placeholder="Search a city, island, or country..."
                    value={formData.destination}
                    onChange={(e) => {
                      handleChange("destination", e.target.value);
                      setIsTypingLocation(true);
                    }}
                  />

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute w-full mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 max-h-72 overflow-y-auto block p-2"
                      >
                        {suggestions.map((place) => (
                          <li
                            key={place.place_id}
                            className="px-4 py-3 mx-1 my-1 rounded-xl hover:bg-blue-50 cursor-pointer flex items-center gap-4 transition-all"
                            onClick={() => {
                              setIsTypingLocation(false);
                              handleChange("destination", place.display_name);
                              setSuggestions([]);
                            }}
                          >
                            <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><MapPin size={18} /></div>
                            <span className="text-gray-800 font-medium leading-relaxed">{place.display_name}</span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Dates Cards */}
              <section className="relative z-50">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 shadow-sm"><Calendar size={20} /></span>
                  When is the trip?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 block">
                  <div className="relative group bg-white border border-gray-200 rounded-2xl p-2 shadow-sm hover:border-purple-300 transition-colors focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:border-purple-500">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-3 mt-2">Check In</label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date) => handleChange("startDate", date)}
                      selectsStart
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      minDate={new Date()}
                      placeholderText="Select start date"
                      className="w-full px-3 pb-2 pt-1 bg-transparent text-gray-900 font-semibold text-lg outline-none cursor-pointer placeholder-gray-300"
                      wrapperClassName="w-full"
                      portalId="root"
                    />
                  </div>
                  <div className="relative group bg-white border border-gray-200 rounded-2xl p-2 shadow-sm hover:border-purple-300 transition-colors focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:border-purple-500">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-3 mt-2">Check Out</label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => handleChange("endDate", date)}
                      selectsEnd
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      minDate={formData.startDate}
                      placeholderText="Select end date"
                      className="w-full px-3 pb-2 pt-1 bg-transparent text-gray-900 font-semibold text-lg outline-none cursor-pointer placeholder-gray-300"
                      wrapperClassName="w-full"
                      portalId="root"
                    />
                  </div>
                </div>
              </section>

              {/* Budget Cards */}
              <section className="relative z-30">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-600 ring-1 ring-green-100 shadow-sm"><Wallet size={20} /></span>
                  What's your spending style?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 block">
                  {budgetOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChange("budget", option.id)}
                      className={`cursor-pointer p-6 rounded-2xl transition-all relative block ${formData.budget === option.id
                        ? "bg-gradient-to-br from-blue-50 to-indigo-50/50 shadow-md ring-2 ring-blue-500"
                        : "bg-white border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                        }`}
                    >
                      <div className="flex flex-col items-center text-center gap-4 relative z-10">
                        <div className={`p-4 rounded-2xl ${formData.budget === option.id ? 'bg-white shadow-sm ring-1 ring-gray-900/5' : 'bg-gray-50'}`}>
                          {option.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{option.label}</h3>
                          <p className="font-medium text-gray-500 mt-1">{option.range}</p>
                        </div>
                      </div>
                      {formData.budget === option.id && (
                        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Interests Multi-Select Pills */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100 shadow-sm"><Palmtree size={20} /></span>
                  Tailor your experience
                </h2>
                <div className="flex flex-wrap gap-3 block flex-col sm:flex-row">
                  {/* Default AI Option */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChange("interests", [])}
                    className={`px-5 py-3 rounded-2xl font-bold flex items-center justify-center sm:justify-start gap-2.5 transition-all text-sm sm:text-base ${
                      formData.interests.length === 0
                        ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 ring-2 ring-gray-900"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:shadow-sm"
                    }`}
                  >
                    <Sparkles className={`w-5 h-5 ${formData.interests.length === 0 ? "text-yellow-400" : "text-gray-400"}`} />
                    Surprise Me!
                    {formData.interests.length === 0 && <span className="ml-1 text-[11px] font-black uppercase tracking-wider opacity-60">(AI's Best Pick)</span>}
                  </motion.button>

                  <div className="h-4 sm:h-8 border-l border-gray-200 mx-1 hidden sm:block"></div>

                  {interestOptions.map((interest) => {
                    const isSelected = formData.interests.includes(interest.id);
                    return (
                      <motion.button
                        key={interest.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleChange(
                            "interests",
                            isSelected
                              ? formData.interests.filter((i) => i !== interest.id)
                              : [...formData.interests, interest.id]
                          )
                        }
                        className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm sm:text-base ${isSelected
                          ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 ring-2 ring-gray-900"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:shadow-sm"
                          }`}
                      >
                        {interest.icon}
                        {interest.label}
                        {isSelected && <Sparkles size={16} className="text-yellow-400 ml-1 opacity-80" />}
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Submit CTA */}
              <div className="pt-8 mt-8 border-t border-gray-100 block">
                <motion.button
                  onClick={handleGenerateTrip}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all flex items-center justify-center gap-3 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative z-10 flex items-center gap-3">
                    {isLoading ? "Curating your trip..." : "Generate My Trip"}
                    {!isLoading && <ChevronRight className="group-hover:translate-x-1 transition-transform" />}
                  </span>
                </motion.button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTrip;