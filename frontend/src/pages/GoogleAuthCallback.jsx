import React, { useEffect } from 'react';

const GoogleAuthCallback = () => {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));

        // Save directly to localStorage first (same keys authContext uses)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Hard redirect so authContext re-reads localStorage fresh on mount
        // This avoids the ProtectedRoute race condition with React state updates
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Google auth callback parse error:', err);
        window.location.href = '/login?error=google_failed';
      }
    } else {
      window.location.href = '/login?error=google_failed';
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ fontSize: '1.1rem', color: '#555' }}>Signing you in with Google...</p>
    </div>
  );
};

export default GoogleAuthCallback;

