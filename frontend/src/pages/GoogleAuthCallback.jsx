import React, { useEffect, useState } from 'react';
import api from '../services/api';

const GoogleAuthCallback = () => {
  const [status, setStatus] = useState('Signing you in with Google...');

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userRaw = params.get('user');

      if (!token || !userRaw) {
        window.location.href = '/login?error=google_failed';
        return;
      }

      try {
        const user = JSON.parse(decodeURIComponent(userRaw));

        // Save token + user to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Apply pending referral code if one was saved before Google redirect
        const pendingCode = localStorage.getItem('pendingReferralCode');
        if (pendingCode) {
          localStorage.removeItem('pendingReferralCode');
          setStatus('Applying referral code...');
          try {
            const result = await api.post(
              '/auth/apply-referral',
              { referralCode: pendingCode },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Referral applied:', result.data.message);
          } catch (err) {
            // Log the actual error so we can debug it
            const msg = err?.response?.data?.message || err.message;
            console.warn('⚠️ Referral code could not be applied:', msg);
            // Non-fatal — user still proceeds to dashboard
          }
        }

        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Google auth callback error:', err);
        window.location.href = '/login?error=google_failed';
      }
    };

    run();
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ fontSize: '1.1rem', color: '#555' }}>{status}</p>
    </div>
  );
};

export default GoogleAuthCallback;
