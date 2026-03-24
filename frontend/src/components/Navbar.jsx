import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate(user ? '/dashboard' : '/', { replace: true });
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white/75 backdrop-blur-xl border-b border-gray-100/50 shadow-[0_2px_20px_rgb(0,0,0,0.04)]"
    >
      <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
        <Link to={user ? '/dashboard' : '/'} onClick={handleLogoClick} className="group flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 transition-colors drop-shadow-sm">
            Trip Planner <span className="text-blue-600">AI</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center space-x-6 sm:space-x-8 mt-4 sm:mt-0">
        {user ? (
          <>
            <Link to="/my-trips" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
              My Trips
            </Link>
            <Link to="/explore" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
              Explore
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-1 focus:outline-none transition-transform hover:scale-105"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-blue-500/30">
                  {user.picture ? (
                    <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                      {user.fullname?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-60 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 z-50 border border-gray-100"
                  >
                    <div className="px-4 py-3 mb-1 bg-gray-50/80 rounded-xl">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.fullname || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {user.email || 'No email available'}
                      </p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all mt-1"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 text-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;