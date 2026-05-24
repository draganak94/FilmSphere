import { useEffect, useState } from 'react';
import api from '../api/axios';
import FilmCard, { Film } from '../components/FilmCard';
import NavBar from '../components/NavBar';

export default function WatchedPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Film[]>('/films/watched')
      .then(res => setFilms(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <NavBar />
        <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-6)' }}>Watched Films</h1>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : films.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>You haven't watched any films yet.</p>
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
