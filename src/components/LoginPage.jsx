
/**
 * LoginPage.jsx
 *
 * This component renders the login form for IMS authentication.
 * Handles username/password input, error display, and login API call.
 *
 * @module src/components/LoginPage
 */


/**
 * LoginPage component
 * Renders the login form and handles authentication logic.
 *
 * @param {Object} props
 * @param {Function} [props.setPage] - (Unused) Function to set the current page
 * @param {Function} [props.setAccessToken] - Setter for access token
 * @param {Function} [props.setUsername] - Setter for username
 * @param {Function} [props.handleLoginSuccess] - Optional callback for successful login
 */
const LoginPage = ({ setPage, setAccessToken, setUsername, handleLoginSuccess }) => {
  /**
   * State for username input
   * @type {[string, Function]}
   */
  const [username, setUsernameInput] = useState('');
  /**
   * State for password input
   * @type {[string, Function]}
   */
  const [password, setPassword] = useState('');
  /**
   * State for error message
   * @type {[string, Function]}
   */
  const [error, setError] = useState('');
  /**
   * State for loading indicator
   * @type {[boolean, Function]}
   */
  const [loading, setLoading] = useState(false);

  /**
   * Handles form submission and login API call.
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Use Vite environment variable for API base URL
      const LOGIN_API_URL = `${import.meta.env.VITE_API_BASE_URL}/login`;
      const response = await fetch(LOGIN_API_URL, {
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
        setAccessToken && setAccessToken(data.access_token);
        setUsername && setUsername(username);
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
        <div className="login-info">
          This is your <b>IMS login</b>.<br/>
          Use your IMS username and password.<br/>
          <span className="login-info-secondary">For password reset or access issues, contact your IMS administrator or visit the IMS password reset page.</span>
        </div>
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
          {error && <div className="login-hint">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
import React, { useState } from 'react';
