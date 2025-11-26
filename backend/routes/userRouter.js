import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/user-model.js';
import postModel from '../models/post-model.js';
import Trip from '../models/tripModel.js';
import Place from '../models/place.js';
import Review from '../models/Review.js';
import multer from 'multer';
import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

import isLoggedIn from '../middlewares/isloggedin.js';
import { getRecommendations } from '../services/recommendationService.js';

const userRouter = express.Router();

// Users Page Route
userRouter.get('/', (req, res) => {
  res.send('Users page is loaded');
});

// User Registration
userRouter.post('/register', async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).send('All input is required');
    }



    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await userModel.create({
      fullname,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send token as cookie
    res.cookie('token', token, { httpOnly: true });
    res.status(201).send('User created');
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

// User Login
userRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('All input is required');
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send('Email or password incorrect');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Email or password incorrect');
    }

    // Generate token
    const token = jwt.sign({ id: user._id, email }, 'highhook', { expiresIn: '1h' });

    // Send token as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'None'
    });

    res.status(200).json({
      message: 'You are logged in',
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        picture: user.picture
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send('Server error');
  }
});


// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "trip_planner_posts", // Your folder name in Cloudinary
    format: async () => "jpg", // Change format if needed
    public_id: (req, file) => file.originalname.split(".")[0] // Use original filename
  }
});

const upload = multer({ storage });

// Updated Route to Upload Image & Store Cloudinary URL
userRouter.post("/createpost", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    let user = await userModel.findOne({ email: req.user.email });

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    let post = new postModel({
      name,
      description,
      userid: user._id,
      picture: req.file.path // Cloudinary URL
    });

    user.post.push(post._id);
    await post.save();
    await user.save();

    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
userRouter.get('/myposts', isLoggedIn, async (req, res) => {
  try {

    let user = await userModel.findOne({ email: req.user.email }).select("fullname email phone post").populate('post');
    res.status(200).json({ post: user.post, fullname: user.fullname, email: user.email, phone: user.phone });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.get('/userdetails', isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email }).select("fullname email phone picture _id");
    res.status(200).json({ _id: user._id, fullname: user.fullname, email: user.email, phone: user.phone, picture: user.picture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
userRouter.put('/:id', isLoggedIn, async (req, res) => {
  try {
    const { fullname, email, phone } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    let user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Ensure the logged-in user is updating their own profile
    if (user.email !== req.user.email) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



userRouter.get('/mytrips', isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email }).select("fullname email phone trips").populate('trips');
    res.status(200).json({ trips: user.trips, fullname: user.fullname, email: user.email, phone: user.phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.get('/mytrip/:tripId', isLoggedIn, async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.tripId).populate('itinerary.places');
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    res.status(200).json({ trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.post('/deletetrip/:tripId', isLoggedIn, async (req, res) => {
  try {
    let trip = await Trip.findByIdAndDelete(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    let user = await userModel.findOne({ email: req.user.email });
    user.trips = user.trips.filter(t => t.toString() !== trip._id.toString());
    await user.save();
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.get('/allposts', async (req, res) => {
  try {
    const posts = await postModel
      .find()
      .populate("userid", "fullname picture")
      .populate("comments.userid", "fullname picture");

    res.status(200).json({ posts });
  } catch (err) {
    console.error("❌ Error fetching posts:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.get('/addReview', async (req, res) => {
  try {
    const { userId, placeId, placeName, rating } = req.body;
    if (!userId || !placeId || !placeName || !rating) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newReview = new Review({
      userId,
      placeId,
      placeName,
      rating,
    });
    await newReview.save();
    res.status(201).json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


userRouter.post('/likepost/:id', isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Fix: Use _id because req.user is a lean object and doesn't have .id virtual
    const userId = req.user._id.toString();

    // Clean up likedBy array to remove nulls
    post.likedBy = post.likedBy.filter(id => id);

    // Fix: Compare ObjectId to string correctly
    const isLiked = post.likedBy.some(id => id.toString() === userId);

    if (isLiked) {
      // Unlike
      post.likes = Math.max(0, post.likes - 1);
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
    } else {
      // Like
      post.likes += 1;
      post.likedBy.push(userId);
    }

    await post.save();
    res.status(200).json({ message: isLiked ? "Post unliked" : "Post liked", likes: post.likes, isLiked: !isLiked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.post('/posts/addcomment/:id', isLoggedIn, async (req, res) => {
  try {
    const { comment } = req.body;
    let user = await userModel.findOne({ email: req.user.email });

    if (!comment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    let post = await postModel.findById(req.params.id);
    post.comments.push({ userid: user._id, comment });
    await post.save();

    res.status(200).json({ message: "Comment added successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.delete('/posts/:postId/comments/:commentId', isLoggedIn, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await postModel.findById(postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);

    if (commentIndex === -1) return res.status(404).json({ message: "Comment not found" });

    // Check ownership - Fix: use _id because req.user is a lean object
    if (post.comments[commentIndex].userid.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({ message: "Comment deleted", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// User Logout
userRouter.get('/logout', (req, res) => {
  res.cookie("token", "");
  res.status(200).json({ message: "Logged out successfully" });
});

// Get personalized recommendations based on user location
// IMPORTANT: This must come BEFORE the /:id route to avoid being matched as a dynamic parameter
userRouter.get('/recommendations', async (req, res) => {
  console.log("🎯 Recommendations endpoint hit!", req.query);
  try {
    const { lat, lng } = req.query;

    console.log("📍 Fetching recommendations for:", { lat, lng });

    // Fetch recommendations
    const recommendations = await getRecommendations(
      parseFloat(lat),
      parseFloat(lng)
    );

    console.log("✅ Recommendations fetched:", recommendations);

    res.status(200).json({ recommendations });
  } catch (err) {
    console.error("❌ Error fetching recommendations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Save a place for the user
userRouter.post('/saveplace', isLoggedIn, async (req, res) => {
  try {
    const { name, lat, lng, rating, address, types } = req.body;
    const userId = req.user._id;

    if (!name || !lat || !lng || !address) {
      return res.status(400).json({ message: "Place details are required" });
    }

    // Find or create the place
    let place = await Place.findOne({ name, address });

    if (!place) {
      place = await Place.create({
        name,
        lat,
        lng,
        rating: rating || 0,
        address,
        types: types || []
      });
    }

    // Check if already saved
    const user = await userModel.findById(userId);
    const alreadySaved = user.saved_places.some(p => p.toString() === place._id.toString());

    if (alreadySaved) {
      return res.status(200).json({ message: "Place already saved", place });
    }

    // Add to user's saved places
    user.saved_places.push(place._id);
    await user.save();

    res.status(200).json({ message: "Place saved successfully", place });
  } catch (err) {
    console.error("Error saving place:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a saved place
userRouter.delete('/saveplace/:placeId', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;
    const { placeId } = req.params;

    const user = await userModel.findById(userId);
    user.saved_places = user.saved_places.filter(p => p.toString() !== placeId);
    await user.save();

    res.status(200).json({ message: "Place removed from saved places" });
  } catch (err) {
    console.error("Error removing saved place:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all saved places for the user
userRouter.get('/savedplaces', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId).populate('saved_places');

    res.status(200).json({ savedPlaces: user.saved_places || [] });
  } catch (err) {
    console.error("Error fetching saved places:", err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.get('/:id', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id)
      .populate('post')
      .populate('saved_places')
      .populate('trips');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Update Post Route
userRouter.put('/updatepost/:id', isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }

    let post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check ownership
    if (post.userid.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update fields
    if (name) post.name = name;
    if (description) post.description = description;
    if (req.file) post.picture = req.file.path; // Update image if new one provided

    await post.save();
    res.status(200).json({ message: "Post updated successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Post Route
userRouter.delete('/deletepost/:id', isLoggedIn, async (req, res) => {
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }

    let post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check ownership
    if (post.userid.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Remove post from user's post array
    let user = await userModel.findById(req.user.id);
    user.post = user.post.filter(p => p.toString() !== req.params.id);
    await user.save();

    // Delete the post
    await postModel.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default userRouter;

