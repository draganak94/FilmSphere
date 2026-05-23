import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import FilmCard, { Film } from '../components/FilmCard';
import GenreSelect from '../components/GenreSelect';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get<Film[]>('/films')
      .then(res => setFilms(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  const genres = useMemo(() => {
    const all = films.flatMap(f => f.genre?.split(',').map(g => g.trim()) ?? []);
    return ['', ...Array.from(new Set(all)).sort()];
  }, [films]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return films.filter(f => {
      const matchesTitle = f.title.toLowerCase().includes(q);
      const matchesGenre = !selectedGenre || f.genre?.split(',').map(g => g.trim()).includes(selectedGenre);
      return matchesTitle && matchesGenre;
    });
  }, [films, search, selectedGenre]);

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-4)' }}>
            FilmSphere
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
            Your cinema, your world.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">Sign in</Link>
            <Link to="/register" className="btn btn-ghost">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
          <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)' }}>
            Welcome, {user.displayName}!
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link to="/watchlist" className="btn btn-ghost btn-sm">My Watchlist</Link>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <input
            type="text"
            placeholder="Search films..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <GenreSelect
            genres={genres.filter(Boolean)}
            value={selectedGenre}
            onChange={setSelectedGenre}
          />
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading films...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No films found.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {filtered.map(film => <FilmCard key={film.id} film={film} />)}
          </div>
        )}
      </div>
    </div>
  );
}
