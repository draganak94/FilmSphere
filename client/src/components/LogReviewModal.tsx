import { useState } from 'react';
import api from '../api/axios';
import DatePickerInput from './DatePickerInput';

interface Props {
  film: { id: number; title: string; posterUrl?: string };
  initialIsLiked: boolean;
  onClose: () => void;
  onSaved: (isLiked: boolean) => void;
  editReview?: {
    id: number;
    rating: number;
    content: string;
    watchedDate?: string;
    isFirstWatch: boolean;
  };
}

export default function LogReviewModal({ film, initialIsLiked, onClose, onSaved, editReview }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const initialDate = editReview?.watchedDate
    ? new Date(editReview.watchedDate).toISOString().split('T')[0]
    : today;

  const [watchedDate, setWatchedDate] = useState(initialDate);
  const [rating, setRating] = useState(editReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [review, setReview] = useState(editReview?.content ?? '');
  const [isFirstWatch, setIsFirstWatch] = useState(editReview?.isFirstWatch ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = watchedDate && rating > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      if (editReview) {
        await api.put(`/films/reviews/${editReview.id}`, {
          rating,
          content: review,
          watchedDate: new Date(watchedDate).toISOString(),
          isFirstWatch,
        });

        if (isLiked !== initialIsLiked) {
          await api.post(`/films/${film.id}/like`);
        }
      } else {
        await api.post(`/films/${film.id}/reviews`, {
          rating,
          content: review,
          watchedDate: new Date(watchedDate).toISOString(),
          isFirstWatch,
        });

        if (isLiked !== initialIsLiked) {
          await api.post(`/films/${film.id}/like`);
        }
      }

      onSaved(isLiked);
    } catch (e: any) {
      setError(e?.response?.data || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{
          width: '100%', maxWidth: 480,
          padding: 'var(--space-6)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-5)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          {film.posterUrl && (
            <img
              src={film.posterUrl}
              alt={film.title}
              style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
            />
          )}
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-1)', color: 'var(--color-primary)' }}>
              {film.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              {editReview ? 'Edit review' : 'Review or log'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 'var(--font-size-xl)', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            Date watched
          </label>
          <DatePickerInput
            value={watchedDate}
            max={today}
            onChange={setWatchedDate}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                style={{
                  fontSize: 28,
                  color: n <= (hoverRating || rating) ? 'var(--color-primary)' : 'var(--text-muted)',
                  transition: 'color var(--transition-fast)',
                  lineHeight: 1,
                }}
              >
                ★
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLiked(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              color: isLiked ? '#e05c7a' : 'var(--text-muted)',
              fontSize: 'var(--font-size-sm)',
              transition: 'color var(--transition-fast)',
            }}
          >
            <span style={{ fontSize: 22 }}>{isLiked ? '♥' : '♡'}</span>
            Like
          </button>
        </div>
        {rating === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
            Select a rating to submit
          </p>
        )}

        <textarea
          rows={4}
          placeholder="Add review..."
          value={review}
          onChange={e => setReview(e.target.value)}
          style={{ resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <button
            onClick={() => setIsFirstWatch(true)}
            className={isFirstWatch ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          >
            First-time watch
          </button>
          <button
            onClick={() => setIsFirstWatch(false)}
            className={!isFirstWatch ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          >
            I've seen this before
          </button>
        </div>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? 'Saving...' : editReview ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
