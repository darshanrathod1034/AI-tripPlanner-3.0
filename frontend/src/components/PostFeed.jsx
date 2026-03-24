import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaTimes, FaTrash, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/authContext';
import { motion, AnimatePresence } from 'framer-motion';

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/users/allposts');
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      alert("Please login to like posts!");
      return;
    }

    try {
      const postIndex = posts.findIndex(p => p._id === postId);
      if (postIndex === -1) return;

      const post = posts[postIndex];
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.some(id => id?.toString() === user._id?.toString());

      const updatedPost = {
        ...post,
        likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
        likedBy: isLiked
          ? likedBy.filter(id => id?.toString() !== user._id?.toString())
          : [...likedBy, user._id]
      };

      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      setPosts(newPosts);

      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(updatedPost);
      }

      await api.post(`/users/likepost/${postId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to comment!");
      return;
    }
    if (!commentText.trim() || !selectedPost) return;

    try {
      const response = await api.post(`/users/posts/addcomment/${selectedPost._id}`,
        { comment: commentText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const updatedPost = response.data.post;
      setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
      setSelectedPost(updatedPost);
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedPost) return;
    if (!window.confirm("Delete this comment?")) return;

    try {
      await api.delete(`/users/posts/${selectedPost._id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const updatedComments = selectedPost.comments.filter(c => c._id !== commentId);
      const updatedPost = { ...selectedPost, comments: updatedComments };

      setPosts(posts.map(p => p._id === selectedPost._id ? updatedPost : p));
      setSelectedPost(updatedPost);

    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      
      {/* Premium Pinterest-Style Masonry Layout */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="columns-1 sm:columns-2 lg:columns-3 gap-6 sm:gap-8 space-y-6 sm:space-y-8"
      >
        {posts.map((post, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={post._id}
            onClick={() => setSelectedPost(post)}
            className="group relative break-inside-avoid cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] transition-all ring-1 ring-slate-200"
          >
            <img
              src={post.picture}
              alt="Community trip"
              className="w-full h-auto block object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
            />

            {/* Glowing Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
              <div className="flex items-center justify-center gap-8 text-white font-black text-2xl drop-shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-2">
                  <FaHeart className={user && post.likedBy?.some(id => id?.toString() === user._id?.toString()) ? "text-red-500" : "text-white"} /> 
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaComment /> 
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Next-Gen Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-slate-900/70 backdrop-blur-2xl"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-white/20"
              onClick={e => e.stopPropagation()}
            >

              {/* Cinematic Image Section */}
              <div className="md:w-[55%] lg:w-[60%] bg-black relative flex items-center justify-center overflow-hidden">
                {/* Backdrop Blur Copy for immersive borders */}
                <div className="absolute inset-0 z-0">
                   <img src={selectedPost.picture} className="w-full h-full object-cover blur-3xl opacity-30 scale-125" alt="" />
                </div>
                <img
                  src={selectedPost.picture}
                  alt={selectedPost.name}
                  className="relative z-10 max-h-[40vh] md:max-h-[90vh] w-full object-contain drop-shadow-2xl"
                />
              </div>

              {/* UI Details Section */}
              <div className="md:w-[45%] lg:w-[40%] flex flex-col h-[50vh] md:h-[90vh] bg-white relative">
                
                {/* Header Profile Row */}
                <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white z-20 shadow-sm relative">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-50 bg-slate-100 flex items-center justify-center">
                      {selectedPost.userid?.picture ? (
                        <img src={selectedPost.userid.picture} alt={selectedPost.userid.fullname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-600 font-black text-lg">
                          {selectedPost.userid?.fullname?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-black text-slate-900 block leading-tight">{selectedPost.userid?.fullname || "Traveler"}</span>
                      {selectedPost.location && <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1 block">{selectedPost.location}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPost(null)} 
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-slate-100 transition-colors"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                {/* Comments & Caption Scroll Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-6 space-y-6 bg-slate-50/30">
                  
                  {/* Original Caption */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 flex items-center justify-center ring-2 ring-white shadow-sm">
                      {selectedPost.userid?.picture ? (
                        <img src={selectedPost.userid.picture} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-600 font-black text-sm">{selectedPost.userid?.fullname?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-[15px] text-slate-800 leading-relaxed font-medium">
                        <span className="font-black text-slate-900 mr-2">{selectedPost.userid?.fullname}</span>
                        {selectedPost.description}
                      </p>
                      <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">
                        {new Date(selectedPost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full mb-2"></div>

                  {/* Public Comments List */}
                  {selectedPost.comments?.length === 0 ? (
                    <div className="text-center py-10 opacity-60">
                      <p className="text-slate-500 font-bold mb-1">No comments yet.</p>
                      <p className="text-sm text-slate-400">Be the first to start the conversation!</p>
                    </div>
                  ) : (
                    selectedPost.comments?.map((comment, idx) => (
                      <div key={idx} className="flex gap-4 group items-start shadow-sm bg-white p-3 rounded-2xl border border-slate-50">
                        <div className="w-8 h-8 rounded-full bg-purple-100 overflow-hidden flex-shrink-0 flex items-center justify-center mt-1">
                          {comment.userid?.picture ? (
                            <img src={comment.userid.picture} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-purple-600 font-black text-xs">
                              {comment.userid?.fullname?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-[14px] text-slate-800 leading-relaxed font-medium">
                            <span className="font-bold text-slate-900 mr-2">{comment.userid?.fullname || 'User'}</span>
                            {comment.comment}
                          </p>
                        </div>
                        {user && comment.userid?._id === user._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-50 rounded-full"
                            title="Delete comment"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Actions & Input Footer */}
                <div className="p-5 md:p-6 border-t border-slate-100 bg-white relative">
                  
                  {/* Interactive Buttons */}
                  <div className="flex gap-5 mb-4">
                    <motion.button
                      onClick={() => handleLike(selectedPost._id)}
                      className="text-[26px] focus:outline-none transition-transform hover:scale-110"
                      whileTap={{ scale: 0.8 }}
                    >
                      {user && selectedPost.likedBy?.some(id => id?.toString() === user._id?.toString()) ? (
                        <FaHeart className="text-red-500 drop-shadow-md" />
                      ) : (
                        <FaRegHeart className="text-slate-700 hover:text-slate-900" />
                      )}
                    </motion.button>
                    <button className="text-[26px] text-slate-700 hover:text-slate-900 transition-transform hover:scale-110">
                      <FaComment />
                    </button>
                  </div>
                  
                  <p className="font-black text-slate-900 mb-5 text-[15px]">{selectedPost.likes} <span className="font-bold text-slate-400">likes</span></p>

                  {/* Glassmorphic Comment Input */}
                  <form onSubmit={handleCommentSubmit} className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] font-medium rounded-2xl px-5 py-3.5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all shadow-inner"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className={`absolute right-2 w-10 h-10 flex items-center justify-center rounded-[12px] transition-all transform ${
                        commentText.trim() ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 hover:shadow-blue-500/30" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <FaPaperPlane size={14} className={commentText.trim() ? "-ml-0.5" : ""} />
                    </button>
                  </form>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostFeed;