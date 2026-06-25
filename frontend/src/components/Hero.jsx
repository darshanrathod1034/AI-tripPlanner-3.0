import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Hero = () => {
  return (
    <div className="relative h-screen w-full flex items-center justify-center lg:justify-start px-4 sm:px-12 lg:px-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80"
          alt="Beautiful travel landscape of mountain range"
          className="w-full h-full object-cover"
        />
        {/* Soft high-contrast overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 lg:bg-gradient-to-r lg:from-black/90 lg:via-black/60 lg:to-transparent"></div>
      </div>

      {/* Hero Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-3xl text-white text-center lg:text-left mt-20 lg:mt-0 w-full"
      >
        <h1 className="leading-tight font-black mb-6">
          <motion.span 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="block text-[#ffb700] text-7xl sm:text-8xl md:text-9xl lg:text-[180px] mb-2 sm:mb-4 tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          >
            Trip{" "}
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-100 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          >
            Your Next Vacation
          </motion.span>
        </h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-lg sm:text-xl text-gray-200 mb-8 max-w-xl mx-auto lg:mx-0"
        >
          Discover hidden gems, create custom itineraries, and share your experiences with the world. Your journey starts here.
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1.1, duration: 0.5 }}
        >
          <Link to='/signUp'>
            <button className="bg-white text-blue-900 px-8 py-4 text-lg sm:text-xl rounded-full font-bold hover:bg-blue-50 cursor-pointer transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl">
              GET STARTED NOW
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Hero
