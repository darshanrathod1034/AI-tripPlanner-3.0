import React from 'react';
import Hero from '../components/Hero';
import Navbar from '../components/Navbar';
import { outline, skyline, world } from '../assets/assets';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      <div className="absolute top-0 w-full z-50">
        <Navbar />
      </div>
      
      {/* Hero Section */}
      <Hero />

      {/* Top Destinations Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Decorative Background Image */}
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none flex justify-end items-start overflow-hidden">
           <img src={world} alt="" className="w-1/2 md:w-1/3 object-contain mt-20" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center relative z-10 mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Top destinations</h2>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">Explore where your fellow travellers are headed for their next holiday adventure.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center relative z-10">
          {[
            { id: 1, city: "Bangkok", country: "Thailand", img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" },
            { id: 2, city: "Paris", country: "France", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { id: 3, city: "Tokyo", country: "Japan", img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }
          ].map((dest, index) => (
            <motion.div 
              key={dest.id} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden group cursor-pointer w-full h-80 shadow-lg hover:shadow-2xl transition-shadow"
            >
              <img
                src={dest.img}
                alt={dest.city}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-6 left-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-3xl font-bold">{dest.city},</h3>
                <p className="text-lg font-medium text-gray-200">{dest.country}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Decorative Outline separator */}
      <div className="w-full overflow-hidden opacity-20 pointer-events-none flex justify-center py-8">
         <img src={outline} alt="outline" className="w-full object-cover max-h-40" />
      </div>

      {/* Testimonials Section */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Don't take our word for it</h2>
            <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
              See what our users have to say about revolutionizing their travel experiences with Trip Planner AI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                id: 1,
                name: "Darshan Rathod",
                review: "Trip Planner AI saves time and stress by aiding travel planning, relieving indecision or uncertainty. Absolutely recommended for any traveler!"
              },
              {
                id: 2,
                name: "Deep Tandel",
                review: "The automatic itinerary generation is mind-blowing. It perfectly scheduled my entire vacation down to the hour, finding incredible hidden gems I would have missed."
              },
              {
                id: 3,
                name: "Priya Sharma",
                review: "I love how easy it is to customize my budget and interests. The generated maps integration made navigating through a new city completely foolproof."
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={testimonial.id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="bg-gray-50 hover:bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 text-xl">{testimonial.name}</h4>
                    <div className="flex text-yellow-400 mt-1.5 text-sm gap-0.5">
                      {'★'.repeat(5)}
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed font-medium italic">
                    "{testimonial.review}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer skyline decoration */}
      <div className="w-full relative mt-auto">
         <img src={skyline} alt="skyline" className="w-full min-h-[100px] object-cover object-bottom" />
         <Footer />
      </div>
    </div>
  );
};

export default Home;