import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user-model.js';
import dotenv from 'dotenv';
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
        if (user) return done(null, user);

        // 2. Check if an account already exists with the same email (OTP user) — link it
        user = await User.findOne({ email: googleEmail });
        if (user) {
          user.googleId = profile.id;
          // Update picture if they don't have one
          if (!user.picture) user.picture = googlePicture;
          await user.save();
          return done(null, user);
        }

        // 3. Create a brand-new Google user (no password)
        const newUser = await User.create({
          fullname: googleName,
          email: googleEmail,
          googleId: profile.id,
          picture: googlePicture,
          password: null,
        });

        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
