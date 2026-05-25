import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import LogReviewModal from '../components/LogReviewModal';

interface DiaryEntry {
  reviewId: number;
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
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const fetchEntry = () => {
    api.get<DiaryEntry>(`/films/${filmId}/my-review`)
      .then(res => setEntry(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntry(); }, [filmId]);

  if (loading) return <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!entry) return <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>Entry not found.</div>;

  const watchedDate = entry.watchedDate ? new Date(entry.watchedDate) : null;
  const formattedDate = watchedDate
    ? watchedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <>
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <Link to="/diary" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-6)', display: 'inline-block' }}>
          ← Back
        </Link>

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
              wordBreak: 'break-word',
              marginBottom: 'var(--space-5)',
            }}>
              {entry.content}
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic', marginBottom: 'var(--space-5)' }}>
              No written review.
            </p>
          )}

          {/* Edit button */}
          <button
            onClick={() => setShowEdit(true)}
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
              padding: '4px var(--space-3)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
            }}
          >
            ✎ Edit review
          </button>
        </div>
      </div>
    </div>

    {showEdit && entry && (
      <LogReviewModal
        film={{ id: entry.filmId, title: entry.title, posterUrl: entry.posterUrl }}
        initialIsLiked={entry.isLiked}
        editReview={{
          id: entry.reviewId,
          rating: entry.rating,
          content: entry.content,
          watchedDate: entry.watchedDate,
          isFirstWatch: entry.isFirstWatch,
        }}
        onClose={() => setShowEdit(false)}
        onSaved={() => {
          setShowEdit(false);
          fetchEntry();
        }}
      />
    )}
    </>
  );
}
