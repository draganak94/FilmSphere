import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{ textAlign: 'center' }}>
        {user ? (
          <>
            <h1
              className="gradient-text"
              style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-8)' }}
            >
              Welcome, {user.displayName}!
            </h1>
            <button className="btn btn-ghost" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <h1
              className="gradient-text"
              style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-4)' }}
            >
              FilmSphere
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
              Your cinema, your world.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary">Sign in</Link>
              <Link to="/register" className="btn btn-ghost">Register</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
