import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { outline, skyline } from '../assets/assets';
import Background from '../components/Background';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/sendotp', { email });
      setMessage(response.data.message || 'OTP sent to your email.');
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    }
  };

  // Handle Signup with OTP Verification
  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/register', {
        fullname,
        email,
        password,
        otp,
        ...(referralCode.trim() && { referralCode: referralCode.trim().toUpperCase() }),
      });

      setMessage(response.data.message || 'Signup successful! Redirecting...');
      
      // Redirect to Dashboard after 1.5 seconds
      setTimeout(() => navigate('/dashboard'), 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center py-12 h-screen">
       <Background/>
        <div className="bg-white absolute p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6">Join Trip Planner!</h2>

          {message && <p className="text-green-600 mb-4">{message}</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <form onSubmit={otpSent ? handleSignup : handleSendOtp}>
            <input
              className="w-full mb-4 p-2 border rounded"
              placeholder="Enter Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {otpSent && (
              <>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  placeholder="Enter OTP"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <input
                  className="w-full mb-4 p-2 border rounded"
                  placeholder="Full Name"
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
                <input
                  className="w-full mb-4 p-2 border rounded"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {/* Referral Code — collapsible section */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🪙</span>
                    <label className="text-sm font-semibold text-gray-700">
                      Have a referral code?
                    </label>
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      +5 bonus credits
                    </span>
                  </div>
                  <input
                    className="w-full p-2.5 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 placeholder-amber-400 text-gray-800 font-mono tracking-widest text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    placeholder="e.g. AB3X7YZ2  (optional)"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    maxLength={8}
                  />
                  {referralCode.length > 0 && referralCode.length < 8 && (
                    <p className="text-xs text-amber-600 mt-1">{8 - referralCode.length} more characters needed</p>
                  )}
                  {referralCode.length === 8 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">✓ Code looks good!</p>
                  )}
                </div>
              </>
            )}

            <button className="w-full bg-blue-900 text-white px-4 py-2 rounded" type="submit">
              {otpSent ? 'Sign Up' : 'Send OTP'}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-700">
            Already have an account?
            <Link to="/login" className="text-blue-600 ml-1">Login</Link>
          </p>

          {/* ── Divider ── */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* ── Referral code for Google signup ── */}
          {!otpSent && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">🪙</span>
                <label className="text-xs font-semibold text-gray-600">
                  Have a referral code? Enter it before signing in with Google
                </label>
              </div>
              <input
                className="w-full p-2.5 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 placeholder-amber-400 text-gray-800 font-mono tracking-widest text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                placeholder="e.g. AB3X7YZ2  (optional)"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
          )}

          {/* ── Google OAuth Button ── */}
          <button
            type="button"
            onClick={() => {
              // Persist referral code so GoogleAuthCallback can apply it after redirect
              if (referralCode.trim()) {
                localStorage.setItem('pendingReferralCode', referralCode.trim().toUpperCase());
              } else {
                localStorage.removeItem('pendingReferralCode');
              }
              window.location.href = `${(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5555').replace(/\/$/, '')}/auth/google`;
            }}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
