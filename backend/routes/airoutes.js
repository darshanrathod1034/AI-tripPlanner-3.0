import express from "express";
import getHybridRecommendations from "../services/hybridRecommendation.js";
import generateAIItinerary from "../services/generateAIItinerary.js";
import userModel from "../models/user-model.js";
import Place from "../models/place.js";
import { deductCredit, refundCredit } from "../services/creditService.js";
import { getHotels } from "../services/hotelService.js";

const airouters = express.Router();

// Recommend places using Hybrid AI System
airouters.post("/recommend", isLoggedIn, async (req, res) => {
  try {
    let userId = await userModel.findOne({ email: req.user.email });
    const { destination, startDate, endDate, budget, preferences } = req.body;

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    // Deduct 1 credit before generating — atomic guard prevents negative balance
    try {
      await deductCredit(userId._id);
    } catch (creditErr) {
      if (creditErr.message === 'insufficient_credits') {
        return res.status(402).json({
          success: false,
          error: 'insufficient_credits',
          message: 'Not enough credits. Earn more by referring friends!',
        });
      }
      throw creditErr;
    }

    // Call AI itinerary function — refund on failure
    let aiResponse;
    try {
      aiResponse = await generateAIItinerary(userId, destination, startDate, endDate, budget, preferences);
    } catch (genErr) {
      // Refund the credit since generation failed
      await refundCredit(userId._id).catch(console.error);
      return res.status(500).json({ error: "Itinerary generation failed" });
    }

    if (!aiResponse || !aiResponse.itinerary) {
      await refundCredit(userId._id).catch(console.error);
      return res.status(500).json({ error: "Itinerary generation failed" });
    }

    console.log("Generated Itinerary:", aiResponse);

    let recommendations = aiResponse.itinerary || [];

    if (!Array.isArray(recommendations)) {
      console.error("❌ Error: itinerary is not an array!");
      recommendations = [];
    }

    for (let day of recommendations) {
      if (day.places && Array.isArray(day.places)) {
        day.places = await Place.find({ _id: { $in: day.places } });
      }
    }

    // Fetch hotels — never let this break the itinerary response
    let hotels = [];
    try {
      hotels = await getHotels(destination, startDate, endDate);
    } catch (hotelErr) {
      console.error('⚠️ Hotel fetch failed (itinerary still returned):', hotelErr.message || hotelErr.code);
      hotels = [];
    }

    res.json({ success: true, recommendations, hotels });
  } catch (error) {
    console.error("❌ Error in Recommendations API:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


import Trip from "../models/tripModel.js";
import isLoggedIn from "../middlewares/isloggedin.js";

export const recommendPlacesForUser = async (userId, destination, preferences) => {
  try {
    let userTrips = await Trip.find({ userId });
    let similarTrips = await Trip.find({
      destination,
      preferences: { $in: preferences },
    });

    let visitedPlaces = userTrips.flatMap((trip) => trip.itinerary.flatMap((d) => d.places));
    let recommendedPlaces = similarTrips
      .flatMap((trip) => trip.itinerary.flatMap((d) => d.places))
      .filter((place) => !visitedPlaces.includes(place));

    return recommendedPlaces;
  } catch (error) {
    console.error("❌ Recommendation Error:", error.message);
    return [];
  }
};


//export { router };

export default airouters;