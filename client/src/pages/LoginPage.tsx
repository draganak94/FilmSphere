import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setAuth(data.accessToken, {
        userId: data.userId,
        username: data.username,
        displayName: data.displayName,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-8)' }}>
          Sign in
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <span className="form-error">{error}</span>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Sign in
          </button>
        </form>

        <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
