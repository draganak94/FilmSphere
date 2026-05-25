import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import LogReviewModal from '../components/LogReviewModal';

interface Review {
  id: number;
  displayName: string;
  rating: number;
  content: string;
  createdAt: string;
  watchedDate?: string;
  isFirstWatch: boolean;
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
  isLiked: boolean;
  isWatched: boolean;
  isVip: boolean;
  hasFullMovie: boolean;
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
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showVipNotice, setShowVipNotice] = useState(false);

  useEffect(() => {
    api.get<FilmDetail>(`/films/${id}`)
      .then(res => setFilm(res.data))
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

  const refreshFilm = async () => {
    const res = await api.get<FilmDetail>(`/films/${id}`);
    setFilm(res.data);
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!film) return <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>Film not found.</div>;

  const embedUrl = getYoutubeEmbedUrl(film.trailerUrl);

  return (
    <>
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
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {!film.isWatched && (
                <button
                  className={film.inWatchlist ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={toggleWatchlist}
                >
                  {film.inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
                </button>
              )}
              {!film.isWatched ? (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowLogModal(true)}
                >
                  Review or log
                </button>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)',
                  padding: '0 var(--space-2)',
                }}>
                  ✓ Watched
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Trailer */}
        {embedUrl && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--color-primary)' }}>Trailer</h2>
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

        {/* Watch full movie */}
        <div style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (film.isVip) {
                navigate(`/watch/${film.id}`);
              } else {
                setShowVipNotice(v => !v);
              }
            }}
            style={{ color: '#472552' }}
          >
            ▶ Watch full movie
          </button>
          {showVipNotice && !film.isVip && (
            <span style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-overlay)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2) var(--space-3)',
            }}>
              You have to upgrade your account to VIP to watch the full movie.{' '}
              <Link to="/vip" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Upgrade now →</Link>
            </span>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-6)', color: 'var(--color-primary)' }}>
            Reviews {film.reviews.length > 0 && <span style={{ color: 'var(--color-primary)', fontWeight: 400 }}>({film.reviews.length})</span>}
          </h2>

          {film.reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {film.reviews.map(r => (
                <div key={r.id} className="card" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.displayName}</span>
                      <span style={{ color: 'var(--color-primary)', marginLeft: 'var(--space-2)' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{r.content}</p>
                  {r.isOwnReview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{
                        fontSize: 'var(--font-size-xl)',
                        color: r.likeCount > 0 ? 'var(--color-primary)' : 'var(--text-muted)',
                        textShadow: r.likeCount > 0 ? 'var(--shadow-glow-primary)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                      }}>
                        ♥ {r.likeCount > 0 && <span style={{ fontSize: 'var(--font-size-sm)' }}>{r.likeCount}</span>}
                      </span>
                      <button
                        onClick={() => setEditingReview(r)}
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-muted)',
                          padding: '2px var(--space-2)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'color var(--transition-fast), border-color var(--transition-fast)',
                        }}
                      >
                        ✎ Edit
                      </button>
                    </div>
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

    {showLogModal && film && (
      <LogReviewModal
        film={{ id: film.id, title: film.title, posterUrl: film.posterUrl }}
        initialIsLiked={film.isLiked}
        onClose={() => setShowLogModal(false)}
        onSaved={async () => {
          setShowLogModal(false);
          await refreshFilm();
        }}
      />
    )}

    {editingReview && film && (
      <LogReviewModal
        film={{ id: film.id, title: film.title, posterUrl: film.posterUrl }}
        initialIsLiked={film.isLiked}
        editReview={{
          id: editingReview.id,
          rating: editingReview.rating,
          content: editingReview.content,
          watchedDate: editingReview.watchedDate,
          isFirstWatch: editingReview.isFirstWatch,
        }}
        onClose={() => setEditingReview(null)}
        onSaved={async () => {
          setEditingReview(null);
          await refreshFilm();
        }}
      />
    )}
    </>
  );
}
