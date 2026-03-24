import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { outline, skyline } from '../assets/assets';
import Background from '../components/Background';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/users/login', {
        email,
        password
      }, {
        withCredentials: true
      });

      if (response.data.token && response.data.user) {
        login(response.data.token, response.data.user);
      } else {
        throw new Error('No token or user data received');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center py-12 h-screen">
        <Background />
        <div className="bg-white absolute p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6">Login</h2>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <form onSubmit={handleLogin}>
            <input
              className="w-full mb-4 p-2 border rounded"
              placeholder="Email"
              type="email"
              name="email"
              id="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full mb-4 p-2 border rounded"
              placeholder="Password"
              type="password"
              name="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
            >
              Login
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* ── Google OAuth Button ── */}
          <button
            type="button"
            onClick={() =>
              window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5555'}/auth/google`
            }
            className="w-full flex items-center justify-center gap-3 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>

          <p className="mt-4 text-center text-gray-700">
            Don't have an account?
            <Link to="/signup" className="text-blue-600 ml-1 hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;