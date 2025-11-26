import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Navbar from "../components/Navbar";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Background from "../components/Background";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import animationData from "../assets/plane-loading.json";
import {
  MapPin, Calendar, Wallet, Gem, Banknote,
  Palmtree, Landmark, Martini, ShoppingBag, Gamepad2,
  Plane, ChevronRight, Search
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (formData.destination.length > 2) {
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${formData.destination}`)
          .then((response) => setSuggestions(response.data))
          .catch((error) => {
            console.error("Error fetching location data:", error);
          });
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [formData.destination]);

  const handleGenerateTrip = async () => {
    if (!user?.token) {
      setError("Please log in to create a trip");
      navigate("/login");
      return;
    }

    if (!formData.destination || !formData.startDate || !formData.endDate || !formData.budget) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setShowLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5555/ai/recommend",
        {
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
          budget: budgetMap[formData.budget],
          preferences: formData.interests,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data?.success) {
        navigate("/view-trip", {
          state: {
            itinerary: response.data.recommendations,
            tripDetails: {
              ...formData,
              numericalBudget: budgetMap[formData.budget]
            }
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
    {
      id: "cheap",
      label: "Budget Friendly",
      range: "~$1000",
      icon: <Wallet className="w-8 h-8 text-green-500" />,
      desc: "Cost-conscious travel"
    },
    {
      id: "moderate",
      label: "Moderate",
      range: "~$2500",
      icon: <Banknote className="w-8 h-8 text-blue-500" />,
      desc: "Balanced experience"
    },
    {
      id: "luxury",
      label: "Luxury",
      range: "~$4000",
      icon: <Gem className="w-8 h-8 text-purple-500" />,
      desc: "Premium comfort"
    },
  ];

  const interestOptions = [
    { id: "nature", label: "Nature", icon: <Palmtree className="w-5 h-5" /> },
    { id: "history", label: "History", icon: <Landmark className="w-5 h-5" /> },
    { id: "nightlife", label: "Nightlife", icon: <Martini className="w-5 h-5" /> },
    { id: "shopping", label: "Shopping", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "entertainment", label: "Fun", icon: <Gamepad2 className="w-5 h-5" /> },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden font-sans">
      <Navbar />
      <div className="absolute inset-0 z-0">
        <Background />
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {showLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
          >
            <div className="w-64 h-64">
              <Lottie animationData={animationData} loop={true} />
            </div>
            <motion.h2
              className="text-white text-2xl font-bold mt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Crafting your perfect trip...
            </motion.h2>
            <p className="text-gray-300 mt-2">Analyzing destinations and preferences</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 pt-28 pb-12 px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Plan Your <span className="text-blue-600">Dream Journey</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tell us your preferences, and our AI will curate a personalized itinerary just for you.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20"
          >
            <div className="p-8 md:p-10 space-y-10">

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2"
                  >
                    <span className="text-xl">⚠️</span> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Destination Section */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <MapPin size={20} />
                  </div>
                  Where to?
                </h2>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg outline-none"
                    placeholder="Search for a destination (e.g., Paris, Tokyo)"
                    value={formData.destination}
                    onChange={(e) => handleChange("destination", e.target.value)}
                  />

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-60 overflow-y-auto"
                      >
                        {suggestions.map((place) => (
                          <li
                            key={place.place_id}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => {
                              handleChange("destination", place.display_name);
                              setSuggestions([]);
                            }}
                          >
                            <MapPin size={16} className="text-gray-400" />
                            <span className="text-gray-700">{place.display_name}</span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Dates Section */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Calendar size={20} />
                  </div>
                  When are you going?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">Start Date</label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date) => handleChange("startDate", date)}
                      selectsStart
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      minDate={new Date()}
                      placeholderText="Select start date"
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none cursor-pointer"
                      wrapperClassName="w-full"
                    />
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">End Date</label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => handleChange("endDate", date)}
                      selectsEnd
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      minDate={formData.startDate}
                      placeholderText="Select end date"
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none cursor-pointer"
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
              </section>

              {/* Budget Section */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <Wallet size={20} />
                  </div>
                  What's your budget?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {budgetOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChange("budget", option.id)}
                      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${formData.budget === option.id
                          ? "border-blue-500 bg-blue-50 shadow-lg"
                          : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-md"
                        }`}
                    >
                      <div className="flex flex-col items-center text-center gap-3 relative z-10">
                        <div className={`p-3 rounded-full ${formData.budget === option.id ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                          {option.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{option.label}</h3>
                          <p className="text-sm text-gray-500 mt-1">{option.range}</p>
                        </div>
                      </div>
                      {formData.budget === option.id && (
                        <motion.div
                          layoutId="budget-selected"
                          className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Interests Section */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Palmtree size={20} />
                  </div>
                  Select your interests
                </h2>
                <div className="flex flex-wrap gap-3">
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
                        className={`px-5 py-3 rounded-full font-medium flex items-center gap-2 transition-all ${isSelected
                            ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                      >
                        {interest.icon}
                        {interest.label}
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Submit Button */}
              <motion.button
                onClick={handleGenerateTrip}
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-3 group"
              >
                {isLoading ? (
                  "Generating..."
                ) : (
                  <>
                    Generate My Trip
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>

            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTrip;