import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function NavBar() {
  const { logout } = useAuthStore();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
      <Link to="/" className="btn btn-ghost btn-sm">← Home</Link>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <Link to="/watched" className="btn btn-ghost btn-sm">Watched</Link>
        <Link to="/diary" className="btn btn-ghost btn-sm">Diary</Link>
        <Link to="/liked" className="btn btn-ghost btn-sm">Liked</Link>
        <Link to="/watchlist" className="btn btn-ghost btn-sm">Watchlist</Link>
        <Link to="/friends" className="btn btn-ghost btn-sm">Friends</Link>
        <Link to="/profile" className="btn btn-ghost btn-sm">Profile</Link>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
