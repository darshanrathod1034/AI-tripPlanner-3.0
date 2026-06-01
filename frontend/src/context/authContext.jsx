import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch credit balance from the server
  const fetchCredits = useCallback(async (token) => {
    try {
      const response = await api.get('/credits/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        setCredits(response.data.credits ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, []);

  // Re-fetch credits (call this after any credit-changing action)
  const refreshCredits = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) await fetchCredits(token);
  }, [fetchCredits]);

  // Check for existing token on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await api.get('/users/userdetails', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setUser({ token, ...response.data });
        // Fetch credits in parallel after user is verified
        await fetchCredits(token);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    setUser({ token, ...userData });
    await fetchCredits(token);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCredits(0);
    navigate('/login');
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ user, credits, login, logout, updateUser, refreshCredits, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
