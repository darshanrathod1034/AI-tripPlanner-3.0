import mongoose from 'mongoose';

const affiliateClickSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    hotelId: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
    },
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

const AffiliateClick = mongoose.model('AffiliateClick', affiliateClickSchema);
export default AffiliateClick;
