import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    password: { type: String, default: null },
    googleId: { type: String, default: null },
    post: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'  // ✅ Matches model name exactly
    }],
    saved_places: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'place'  // Ensure it matches the place model
    }],
    preferences: [String], // ["beaches", "adventure", "history"]
    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trip" }],
    phone: Number,
    picture: { type: String, default: "" },
    credits: { type: Number, default: 5, min: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
});

const userModel = mongoose.model('users', userSchema);  // ✅ Keep as 'users'
export default userModel;
