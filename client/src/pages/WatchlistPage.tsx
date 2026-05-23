import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FilmCard, { Film } from '../components/FilmCard';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Film[]>('/films/watchlist')
      .then(res => setFilms(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)' }}>My Watchlist</h1>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : films.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Your watchlist is empty. Start adding films!</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {films.map(film => <FilmCard key={film.id} film={film} />)}
          </div>
        )}
      </div>
    </div>
  );
}
