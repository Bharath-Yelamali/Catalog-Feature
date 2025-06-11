import React, { useState } from 'react';
import '../App.css';

const LoginPage = ({ setPage, setAccessToken, setUsername, handleLoginSuccess }) => {
  const [username, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          setError('Invalid username or password');
        } else {
          setError(data.error || 'Login failed.');
        }
        setLoading(false);
        return;
      }
      setLoading(false);
      // Use handleLoginSuccess to set token, username, and fetch first name
      if (typeof handleLoginSuccess === 'function') {
        await handleLoginSuccess(data.access_token, username);
      } else {
        setAccessToken(data.access_token);
        setUsername(username);
      }
      // Do not setPage here; let parent App handle redirect after login
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="centralized-login-bg">
      <div className="centralized-login-box">
        <div className="login-title">Sign in to your account</div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-row">
            <input
              type="text"
              className="login-input"
              placeholder="Username"
              value={username}
              onChange={e => setUsernameInput(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="login-form-row">
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="login-hint" style={{ color: '#d27a7a', marginBottom: 8 }}>{error}</div>}
          <button type="submit" className="login-btn" style={{ cursor: 'pointer', opacity: 1 }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
