import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaMapMarkerAlt, FaEnvelope, FaPhone, FaPen, FaBookmark, FaHeart } from 'react-icons/fa';

const AccountPage = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
  });
  const [posts, setPosts] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/users/${user._id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const userData = response.data;
        setFormData({
          fullname: userData.fullname || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
        setPosts(userData.post || []);
        setSavedPlaces(userData.saved_places || []);
        setTrips(userData.trips || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchUserData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      toast.error("User ID missing. Please relogin.");
      return;
    }
    try {
      await api.put(`/users/${user._id}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      updateUser(formData);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/users/deletepost/${postId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPosts(posts.filter(post => post._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleEditPost = (post) => {
    navigate('/createpost', { state: { post } });
  };

  const tabs = [
    { id: 'posts', label: 'My Posts', count: posts.length, icon: FaPen },
    { id: 'saved', label: 'Saved Places', count: savedPlaces.length, icon: FaBookmark },
    { id: 'trips', label: 'My Trips', count: trips.length, icon: FaHeart },
  ];

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-x-hidden">
      <Navbar />

      {/* Immersive Cover Photo Banner */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden top-0 left-0 bg-blue-50/50 border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent z-10"></div>
        <img 
          src={`https://source.unsplash.com/1920x1080/?travel,landscape,nature`} 
          alt="Profile Cover" 
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-32">
        {/* Glassmorphic Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 overflow-hidden mb-12"
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10">
              
              {/* Premium Avatar */}
              <div className="relative flex-shrink-0 group">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
                  {user.picture ? (
                    <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl text-blue-600 font-black">
                      {user.fullname?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
              </div>

              {/* User Details & Edit Form */}
              <div className="flex-1 w-full text-center md:text-left">
                {editMode ? (
                  <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto md:mx-0">
                    <h3 className="text-xl font-black text-slate-900 mb-6">Edit Profile Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                        <input
                          type="text" name="fullname" value={formData.fullname} onChange={handleInputChange} required
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                        <input
                          type="email" name="email" value={formData.email} onChange={handleInputChange} required
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                        <input
                          type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="flex justify-center md:justify-start gap-4 pt-4">
                      <button type="submit" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105">
                        Save Changes
                      </button>
                      <button type="button" onClick={() => setEditMode(false)} className="px-8 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mt-4 md:mt-6">
                    <div>
                      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">{user.fullname}</h1>
                      <div className="space-y-2 mt-4">
                        <p className="text-slate-600 font-medium flex items-center justify-center md:justify-start gap-3">
                          <FaEnvelope className="text-slate-400" /> {user.email}
                        </p>
                        {formData.phone && (
                          <p className="text-slate-600 font-medium flex items-center justify-center md:justify-start gap-3">
                            <FaPhone className="text-slate-400" /> {formData.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold flex items-center gap-2 rounded-2xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all transform hover:scale-105"
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* iOS-Style Segmented Navigation Tabs */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-6">
            <div className="flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar justify-start md:justify-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap overflow-hidden ${
                      isActive ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-600 rounded-2xl z-0"></motion.div>
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Icon className={isActive ? "text-blue-200" : ""} /> {tab.label}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20" : "bg-slate-200"}`}>
                        {tab.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content Galleries */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 min-h-[400px]"
          >
            {/* -------------------- MY POSTS -------------------- */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Your Travel Posts</h2>
                  <button onClick={() => navigate('/createpost')} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all hover:scale-105 flex items-center gap-2 text-sm">
                    <FaEdit /> Create Post
                  </button>
                </div>

                {posts.length > 0 ? (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {posts.map(post => (
                      <div key={post._id} className="group relative break-inside-avoid rounded-[2rem] overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all border border-slate-100">
                        {post.picture ? (
                          <img src={post.picture} alt={post.name} className="w-full h-auto block object-cover" />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-slate-100 text-slate-400">No Image</div>
                        )}
                        
                        {/* Interactive Dark Overlay */}
                        <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                          <h3 className="font-black text-white text-xl line-clamp-2 leading-tight drop-shadow-md">{post.name}</h3>
                          
                          <div className="flex gap-3 mt-auto">
                            <button onClick={() => handleEditPost(post)} className="flex-1 bg-white/20 hover:bg-blue-600 backdrop-blur-md text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                              <FaPen size={12} /> Edit
                            </button>
                            <button onClick={() => handleDeletePost(post._id)} className="flex-1 bg-white/20 hover:bg-red-500 backdrop-blur-md text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                              <FaTrash size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
                    <div className="mx-auto w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-3xl mb-4">
                      <FaPen />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Record your journey</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first public post to share your travel experiences with the world.</p>
                    <button onClick={() => navigate('/createpost')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-md transition-all hover:scale-105">
                      Write a Post
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* -------------------- SAVED PLACES -------------------- */}
            {activeTab === 'saved' && (
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-8">Your Saved Places</h2>
                {savedPlaces.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {savedPlaces.map(place => (
                      <div key={place._id} className="group relative rounded-[2rem] h-[300px] overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer">
                        {place.image ? (
                          <img src={place.image} alt={place.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <img src={`https://source.unsplash.com/800x600/?${encodeURIComponent(place.name)},travel`} alt={place.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <h3 className="font-black text-white text-2xl mb-2 drop-shadow-md leading-tight">{place.name}</h3>
                          <p className="text-blue-300 font-bold text-sm flex items-start gap-1">
                            <FaMapMarkerAlt className="mt-0.5" /> {place.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
                    <div className="mx-auto w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-3xl mb-4">
                      <FaBookmark />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No bookmarks yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">When you explore community posts, hit the bookmark icon to save places here for later.</p>
                  </div>
                )}
              </div>
            )}

            {/* -------------------- MY TRIPS -------------------- */}
            {activeTab === 'trips' && (
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-8">Generated AI Itineraries</h2>
                {trips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trips.map(trip => (
                      <div key={trip._id} onClick={() => navigate(`/trips/${trip._id}`)} className="group relative rounded-[2.5rem] p-6 sm:p-8 bg-white shadow-md hover:shadow-2xl transition-all cursor-pointer border border-slate-100">
                        <div className="absolute top-0 right-0 p-6">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trip.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                             {trip.status || 'Planned'}
                           </span>
                        </div>
                        <h3 className="font-black text-2xl text-slate-900 mb-1 leading-tight pr-24">{trip.destination}</h3>
                        <p className="text-slate-400 font-bold text-sm mb-8 uppercase tracking-wider">
                          {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        
                        <div className="flex justify-between items-end">
                           <div className="flex items-center gap-2">
                              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">{trip.budget}</span>
                              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">{trip.itinerary?.length} Days</span>
                           </div>
                           <motion.button whileHover={{ scale: 1.1 }} className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              &rarr;
                           </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
                     <div className="mx-auto w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-3xl mb-4">
                      <FaHeart />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No trips generated</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Let our AI build your dream vacation from scratch instantly.</p>
                    <button onClick={() => navigate('/create-trip')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-md transition-all hover:scale-105">
                      Generate a Trip
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AccountPage;