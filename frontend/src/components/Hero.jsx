import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Hero = () => {
  return (
    <div className="relative h-screen w-full flex items-center justify-center lg:justify-start px-4 sm:px-12 lg:px-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://content.api.news/v3/images/bin/4491bf978b849ce0b2f54b196c81cbd9"
          alt="Mountain View"
          className="w-full h-full object-cover"
        />
        {/* Soft overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
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
            className="block text-[#ffb700] text-7xl sm:text-8xl md:text-9xl lg:text-[180px] mb-2 sm:mb-4 tracking-tighter"
          >
            Trip
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold"
          >
            your next Vacation
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
