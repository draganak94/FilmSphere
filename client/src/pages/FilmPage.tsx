import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface Review {
  id: number;
  displayName: string;
  rating: number;
  content: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isOwnReview: boolean;
}

interface FilmDetail {
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
  inWatchlist: boolean;
  reviews: Review[];
}

function getYoutubeEmbedUrl(url?: string) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function FilmPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    api.get<FilmDetail>(`/films/${id}`)
      .then(res => {
        setFilm(res.data);
        setAlreadyReviewed(res.data.reviews.some(r => r.displayName === user?.displayName));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleWatchlist = async () => {
    if (!film) return;
    const res = await api.post<{ inWatchlist: boolean }>(`/films/${film.id}/watchlist`);
    setFilm(f => f ? { ...f, inWatchlist: res.data.inWatchlist } : f);
  };

  const toggleLike = async (reviewId: number) => {
    const res = await api.post<{ liked: boolean; count: number }>(`films/reviews/${reviewId}/like`);
    setFilm(f => f ? {
      ...f,
      reviews: f.reviews.map(r => r.id === reviewId
        ? { ...r, likedByMe: res.data.liked, likeCount: res.data.count }
        : r)
    } : f);
  };

  const submitReview = async () => {
    if (!film || !reviewText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/films/${film.id}/reviews`, { rating: reviewRating, content: reviewText });
      const res = await api.get<FilmDetail>(`/films/${film.id}`);
      setFilm(res.data);
      setAlreadyReviewed(true);
      setReviewText('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!film) return <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>Film not found.</div>;

  const embedUrl = getYoutubeEmbedUrl(film.trailerUrl);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container" style={{ maxWidth: 960 }}>

        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-6)' }}>
          ← Back
        </button>

        {/* Header */}
        <div style={{ display: 'flex', gap: 'var(--space-8)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
          {film.posterUrl && (
            <img src={film.posterUrl} alt={film.title} style={{ width: 200, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
              {film.title}
            </h1>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              {film.year} · {film.director}
              {film.durationMinutes && ` · ${film.durationMinutes} min`}
            </div>
            {film.genre && (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                {film.genre.split(',').map(g => g.trim()).join(' · ')}
              </div>
            )}
            {film.averageRating > 0 && (
              <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                ★ {film.averageRating.toFixed(1)} / 5
              </div>
            )}
            {film.description && (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
                {film.description}
              </p>
            )}
            {film.cast && (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Cast:</strong> {film.cast}
              </p>
            )}
            <button
              className={film.inWatchlist ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              onClick={toggleWatchlist}
            >
              {film.inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
            </button>
          </div>
        </div>

        {/* Trailer */}
        {embedUrl && (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>Trailer</h2>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <iframe
                src={embedUrl}
                title="Trailer"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-6)' }}>
            Reviews {film.reviews.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({film.reviews.length})</span>}
          </h2>

          {!alreadyReviewed && (
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>Write a review</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Rating:</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      color: n <= reviewRating ? 'var(--color-primary)' : 'var(--text-muted)',
                      transition: 'color var(--transition-fast)',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                placeholder="Share your thoughts..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                style={{ marginBottom: 'var(--space-4)', resize: 'vertical' }}
              />
              <button className="btn btn-primary btn-sm" onClick={submitReview} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {film.reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {film.reviews.map(r => (
                <div key={r.id} className="card" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{r.displayName}</span>
                      <span style={{ color: 'var(--color-primary)', marginLeft: 'var(--space-2)' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>{r.content}</p>
                  {r.isOwnReview ? (
                    <span style={{
                      fontSize: 'var(--font-size-xl)',
                      color: r.likeCount > 0 ? 'var(--color-primary)' : 'var(--text-muted)',
                      textShadow: r.likeCount > 0 ? 'var(--shadow-glow-primary)' : 'none',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                    }}>
                      ♥ {r.likeCount > 0 && <span style={{ fontSize: 'var(--font-size-sm)' }}>{r.likeCount}</span>}
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleLike(r.id)}
                      style={{
                        fontSize: 'var(--font-size-xl)',
                        color: r.likedByMe ? 'var(--color-primary)' : 'var(--text-muted)',
                        textShadow: r.likedByMe ? 'var(--shadow-glow-primary)' : 'none',
                        transition: 'color var(--transition-fast), text-shadow var(--transition-fast)',
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                      }}
                    >
                      ♥ {r.likeCount > 0 && <span style={{ fontSize: 'var(--font-size-sm)' }}>{r.likeCount}</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
