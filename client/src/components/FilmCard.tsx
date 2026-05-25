export interface Film {
  id: number;
  title: string;
  year: number;
  director: string;
  description?: string;
  genre?: string;
  durationMinutes?: number;
  cast?: string;
  posterUrl?: string;
  trailerUrl?: string;
  averageRating: number;
}

import { useNavigate } from 'react-router-dom';

export default function FilmCard({ film }: { film: Film }) {
  const navigate = useNavigate();
  return (
    <div className="card-hover" onClick={() => navigate(`/films/${film.id}`)} style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', backgroundColor: 'var(--bg-elevated)' }}>
        {film.posterUrl ? (
          <img
            src={film.posterUrl}
            alt={film.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)'
          }}>
            No poster
          </div>
        )}
        {film.averageRating > 0 && (
          <div style={{
            position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)',
            background: 'rgba(0,0,0,0.75)', borderRadius: 'var(--radius-sm)',
            padding: '2px var(--space-2)', fontSize: 'var(--font-size-xs)',
            color: 'var(--color-primary)', fontWeight: 700,
          }}>
            ★ {film.averageRating.toFixed(1)}
          </div>
        )}
      </div>
      <div style={{ padding: 'var(--space-3)' }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)', color: 'var(--color-primary)' }}>
          {film.title}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
          {film.year}
        </div>
        {film.genre && (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
            {film.genre.split(',').map(g => g.trim()).filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
