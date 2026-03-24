import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative w-full bg-white border-t border-gray-100 pt-16 pb-8 overflow-hidden z-20">
      {/* Decorative background blur */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6 transition-transform hover:scale-105">
              <span className="text-3xl font-black tracking-tight text-gray-900 transition-colors drop-shadow-sm">
                Trip Planner <span className="text-blue-600">AI</span>
              </span>
            </Link>
            <p className="max-w-md text-gray-500 text-sm leading-relaxed mb-8">
              Turn your next trip into a hassle-free experience with Trip Planner AI. We build intelligent 
              itineraries tailored exactly to your preferences, budget, and travel style.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors shadow-sm border border-gray-100">
                 <span className="font-bold text-sm">X</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors shadow-sm border border-gray-100">
                 <span className="font-bold text-sm">in</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-black text-gray-900 mb-6 uppercase tracking-wider text-sm">Legal</h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="/terms" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-black text-gray-900 mb-6 uppercase tracking-wider text-sm">Support</h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="/contact" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Contact Us</Link></li>
              <li><Link to="/integrations" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">B2B Integrations</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-gray-900 mb-6 uppercase tracking-wider text-sm">Itineraries</h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="/explore" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Community Trips</Link></li>
              <li><Link to="/destinations" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Find Destinations</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-100 pt-8 mt-8">
          <p className="text-sm font-medium text-gray-400 mb-4 md:mb-0">
            © {new Date().getFullYear()} Trip Planner AI. All rights reserved.
          </p>
          
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold mr-2">Built by</span>
            <span className="hover:text-blue-600 transition-colors cursor-pointer">Darshan Rathod</span>
            <span className="text-gray-300 mx-1">&amp;</span>
            <span className="hover:text-blue-600 transition-colors cursor-pointer">Deep Tandel</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
