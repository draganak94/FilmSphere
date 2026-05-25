import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface FilmInfo {
  id: number;
  title: string;
  year: number;
  isVip: boolean;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore(s => s.accessToken);
  const [film, setFilm] = useState<FilmInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<FilmInfo>(`/films/${id}`)
      .then(res => setFilm(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  if (!film) {
    return <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>Film not found.</div>;
  }

  if (!film.isVip) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', background: 'var(--bg-base)' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>
              VIP Required
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              You have to upgrade your account to VIP if you want to watch the full movie.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/vip" className="btn btn-primary btn-sm" style={{ color: '#472552' }}>
              Upgrade to VIP for $9.99
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              ← Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stream URL includes the JWT token as a query param because <video> cannot
  // send Authorization headers. The backend accepts it via OnMessageReceived.
  const streamUrl = `${api.defaults.baseURL}/films/stream?movie_id=${id}&access_token=${token}`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 'var(--space-8) var(--space-6)', overflow: 'hidden' }}>
      <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-primary)', margin: 0 }}>
            {film.title}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 'var(--font-size-lg)', marginLeft: 'var(--space-3)' }}>
              ({film.year})
            </span>
          </h1>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            src={streamUrl}
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', borderRadius: 'var(--radius-lg)' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
