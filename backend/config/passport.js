import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user-model.js';
import dotenv from 'dotenv';
import { generateReferralCode, awardCredits } from '../services/creditService.js';
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleEmail = profile.emails[0].value;
        const googleName = profile.displayName;
        const googlePicture = profile.photos?.[0]?.value || '';

        // 1. Check if a user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          // If soft-deleted, restore it
          if (user.isDeleted) {
            user.isDeleted = false;
            user.deletedAt = null;
            if (!user.picture) user.picture = googlePicture;
            await user.save();
            console.log(`♻️ Restored deleted Google account: ${user.email}`);
          }
          return done(null, user);
        }

        // 2. Check if an account already exists with the same email (OTP user) — link it
        user = await User.findOne({ email: googleEmail });
        if (user) {
          // If soft-deleted, restore it
          if (user.isDeleted) {
            user.isDeleted = false;
            user.deletedAt = null;
          }
          user.googleId = profile.id;
          if (!user.picture) user.picture = googlePicture;
          await user.save();
          return done(null, user);
        }

        // 3. Create a brand-new Google user (no password)
        const newReferralCode = await generateReferralCode();
        const newUser = await User.create({
          fullname: googleName,
          email: googleEmail,
          googleId: profile.id,
          picture: googlePicture,
          password: null,
          referralCode: newReferralCode,
          credits: 0,
        });

        // Award signup bonus
        await awardCredits(newUser._id, 5, 'signup_bonus');

        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
