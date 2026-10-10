import React, { useState } from 'react';
import './App.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    onLogin({
      name: email.split('@')[0],
      email,
      role: 'admin',
    });
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="brand">
          <div className="logo">B</div>
          <h1>Business Chat</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>Welcome back</h2>
          <p>Sign in to manage your workspace</p>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="/">Forgot password?</a>
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>

          <button type="button" className="secondary-btn">
            Create Workspace
          </button>
        </form>
      </div>

      <div className="promo-panel">
        <div className="promo-card">
          <span className="badge">Business Communication</span>
          <h3>Collaborate in real time</h3>
          <ul>
            <li>Team chats</li>
            <li>Private channels</li>
            <li>Admin controls</li>
            <li>Video calls</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
