import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';

interface DiaryEntry {
  filmId: number;
  title: string;
  year: number;
  posterUrl?: string;
  watchedDate?: string;
  rating: number;
  content: string;
  isFirstWatch: boolean;
  isLiked: boolean;
}

export default function DiaryEntryPage() {
  const { filmId } = useParams<{ filmId: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DiaryEntry>(`/films/${filmId}/my-review`)
      .then(res => setEntry(res.data))
      .finally(() => setLoading(false));
  }, [filmId]);

  if (loading) return <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!entry) return <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>Entry not found.</div>;

  const watchedDate = entry.watchedDate ? new Date(entry.watchedDate) : null;
  const formattedDate = watchedDate
    ? watchedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <NavBar />

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {/* Film header */}
          <div style={{ display: 'flex', gap: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
            {entry.posterUrl && (
              <Link to={`/films/${entry.filmId}`} style={{ flexShrink: 0 }}>
                <img
                  src={entry.posterUrl}
                  alt={entry.title}
                  style={{
                    width: 90,
                    borderRadius: 'var(--radius-md)',
                    display: 'block',
                    transition: 'opacity var(--transition-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                />
              </Link>
            )}
            <div style={{ flex: 1 }}>
              <Link
                to={`/films/${entry.filmId}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-1)' }}>
                  {entry.title}
                </h1>
              </Link>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                {entry.year}
              </div>
            </div>
          </div>

          {/* Metadata row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', alignItems: 'center' }}>
            {formattedDate && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Watched {formattedDate}
              </span>
            )}
            {entry.rating > 0 && (
              <span style={{ color: 'var(--color-primary)', letterSpacing: 2, fontSize: 'var(--font-size-lg)' }}>
                {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
              </span>
            )}
            {entry.isLiked && (
              <span style={{ color: '#e05c7a', fontSize: 'var(--font-size-lg)' }}>♥</span>
            )}
            <span style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 8px',
            }}>
              {entry.isFirstWatch ? 'First watch' : 'Rewatch'}
            </span>
          </div>

          {/* Review text */}
          {entry.content ? (
            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
              fontSize: 'var(--font-size-sm)',
              whiteSpace: 'pre-wrap',
            }}>
              {entry.content}
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
              No written review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
