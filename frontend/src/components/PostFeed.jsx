import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaTimes, FaTrash } from 'react-icons/fa';
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
      // Optimistic update
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

      // API Call
      await api.post(`/users/likepost/${postId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

    } catch (err) {
      console.error('Error liking post:', err);
      // Revert on error (could be implemented for better UX)
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

      // Update posts state
      setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));

      // Update selected post state
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

      // Optimistic update
      const updatedComments = selectedPost.comments.filter(c => c._id !== commentId);
      const updatedPost = { ...selectedPost, comments: updatedComments };

      setPosts(posts.map(p => p._id === selectedPost._id ? updatedPost : p));
      setSelectedPost(updatedPost);

    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {posts.map(post => (
          <div
            key={post._id}
            onClick={() => setSelectedPost(post)}
            className="relative group aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
          >
            <img
              src={post.picture}
              alt={post.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-8 text-white font-bold text-lg">
              <div className="flex items-center gap-2">
                <FaHeart /> {post.likes}
              </div>
              <div className="flex items-center gap-2">
                <FaComment /> {post.comments?.length || 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
              onClick={e => e.stopPropagation()}
            >

              {/* Image Section */}
              <div className="md:w-[60%] bg-black flex items-center justify-center">
                <img
                  src={selectedPost.picture}
                  alt={selectedPost.name}
                  className="max-h-[50vh] md:max-h-[90vh] w-full object-contain"
                />
              </div>

              {/* Details Section */}
              <div className="md:w-[40%] flex flex-col h-[50vh] md:h-auto bg-white">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {selectedPost.userid?.picture ? (
                        <img src={selectedPost.userid.picture} alt={selectedPost.userid.fullname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                          {selectedPost.userid?.fullname?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-gray-900">{selectedPost.userid?.fullname}</span>
                  </div>
                  <button onClick={() => setSelectedPost(null)} className="text-gray-500 hover:text-gray-900">
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* Comments Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Caption */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {selectedPost.userid?.picture ? (
                        <img src={selectedPost.userid.picture} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                          {selectedPost.userid?.fullname?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-bold mr-2">{selectedPost.userid?.fullname}</span>
                        {selectedPost.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Comments List */}
                  {selectedPost.comments?.map((comment, idx) => (
                    <div key={idx} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {comment.userid?.picture ? (
                          <img src={comment.userid.picture} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-xs font-bold">
                            {comment.userid?.fullname?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-bold mr-2">{comment.userid?.fullname || 'User'}</span>
                          {comment.comment}
                        </p>
                      </div>
                      {user && comment.userid?._id === user._id && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-4 mb-3">
                    <button
                      onClick={() => handleLike(selectedPost._id)}
                      className="text-2xl hover:opacity-70 transition-opacity focus:outline-none"
                    >
                      <motion.div
                        whileTap={{ scale: 0.8 }}
                        animate={user && selectedPost.likedBy?.some(id => id?.toString() === user._id?.toString()) ? { scale: [1, 1.2, 1] } : {}}
                      >
                        {user && selectedPost.likedBy?.some(id => id?.toString() === user._id?.toString()) ? (
                          <FaHeart className="text-red-500" />
                        ) : (
                          <FaRegHeart />
                        )}
                      </motion.div>
                    </button>
                    <button className="text-2xl hover:opacity-70 transition-opacity">
                      <FaComment />
                    </button>
                  </div>
                  <p className="font-bold mb-1">{selectedPost.likes} likes</p>
                  <p className="text-xs text-gray-500 uppercase mb-4">
                    {new Date(selectedPost.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  </p>

                  {/* Comment Input */}
                  <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 text-sm border-none focus:ring-0 p-0"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="text-blue-500 font-bold text-sm disabled:opacity-50 hover:text-blue-700"
                    >
                      Post
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