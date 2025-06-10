import React, { useState } from 'react';
import '../App.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    // TODO: Implement login logic
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
              onChange={e => setUsername(e.target.value)}
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
          <button type="submit" className="login-btn" style={{ cursor: 'pointer', opacity: 1 }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
