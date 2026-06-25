import mongoose from 'mongoose';

const hotelCacheSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  destination: {
    type: String,
  },
  startDate: {
    type: String,
  },
  endDate: {
    type: String,
  },
  hotels: {
    type: Array,
  },
  cachedAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index — documents expire after 6 hours (21600 seconds)
hotelCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 21600 });

const HotelCache = mongoose.model('HotelCache', hotelCacheSchema);
export default HotelCache;
