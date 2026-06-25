import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home, Map, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center px-6 py-24 font-sans relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl text-center relative z-10">
        {/* Animated Compass Icon */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-32 h-32 text-blue-600 mb-8 flex items-center justify-center bg-blue-50 rounded-full border-4 border-white shadow-xl"
        >
          <Compass className="w-16 h-16" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-8xl font-black text-gray-900 tracking-tight"
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-bold text-gray-800 mt-4"
        >
          Looks like you're lost!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-600 mt-4 leading-relaxed"
        >
          The page you are looking for doesn't exist or has been moved. Let's get you back on track to planning your next adventure.
        </motion.p>

        {/* Interactive Button / Link List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
          
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-full font-bold shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Map className="w-5 h-5 text-orange-500" />
            Plan a Trip
          </Link>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={() => window.history.back()}
            className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
