import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import { Film } from '../components/FilmCard';

const API_ORIGIN = new URL(api.defaults.baseURL!).origin;
const resolveUrl = (url?: string) =>
  url?.startsWith('/') ? `${API_ORIGIN}${url}` : url;

interface FavoriteFilm {
  filmId: number;
  title: string;
  posterUrl?: string;
  sortOrder: number;
}

interface Profile {
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVip: boolean;
  favorites: FavoriteFilm[];
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<number>(1);
  const [watchedFilms, setWatchedFilms] = useState<Film[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  useEffect(() => {
    api.get<Profile>('/profile')
      .then(res => setProfile(res.data))
      .catch(err => setError(err.response?.data?.message ?? err.message ?? 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);


  const handleCancelVip = async () => {
    setCancelLoading(true);
    setCancelConfirmOpen(false);
    try {
      await api.post('/stripe/cancel');
      setProfile(prev => prev ? { ...prev, isVip: false } : prev);
    } catch {
      // silently ignore
    } finally {
      setCancelLoading(false);
    }
  };

  const openPicker = async (slot: number) => {
    setPickerSlot(slot);
    setPickerSearch('');
    setPickerOpen(true);
    if (watchedFilms.length === 0) {
      const res = await api.get<Film[]>('/films/watched');
      setWatchedFilms(res.data);
    }
  };

  const selectFilm = async (film: Film) => {
    if (!profile) return;
    const filtered = profile.favorites.filter(f => f.filmId !== film.id);
    const slots: (FavoriteFilm | null)[] = Array(5).fill(null);
    filtered.forEach(f => { slots[f.sortOrder - 1] = f; });
    slots[pickerSlot - 1] = { filmId: film.id, title: film.title, posterUrl: film.posterUrl ?? undefined, sortOrder: pickerSlot };
    const updated = slots
      .map((s, i) => s ? { ...s, sortOrder: i + 1 } : null)
      .filter(Boolean) as FavoriteFilm[];
    setPickerOpen(false);
    await saveFavorites(updated);
  };

  const removeFavorite = async (filmId: number) => {
    if (!profile) return;
    const updated = profile.favorites
      .filter(f => f.filmId !== filmId)
      .map((f, i) => ({ ...f, sortOrder: i + 1 }));
    await saveFavorites(updated);
  };

  const saveFavorites = async (updated: FavoriteFilm[]) => {
    await api.put('/profile/favorites', { filmIds: updated.map(f => f.filmId) });
    setProfile(prev => prev ? { ...prev, favorites: updated } : prev);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<{ avatarUrl: string }>('/profile/avatar/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(prev => prev ? { ...prev, avatarUrl: `${res.data.avatarUrl}?t=${Date.now()}` } : prev);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (error) return <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>Error: {error}</div>;
  if (!profile) return null;

  const initials = profile.displayName.slice(0, 2).toUpperCase();
  const slots: (FavoriteFilm | null)[] = Array(5).fill(null);
  profile.favorites.forEach(f => { slots[f.sortOrder - 1] = f; });

  const filteredWatched = watchedFilms.filter(f =>
    f.title.toLowerCase().includes(pickerSearch.toLowerCase()) &&
    !profile.favorites.some(fav => fav.filmId === f.id)
  );

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <NavBar />

        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          <label style={{ position: 'relative', cursor: avatarUploading ? 'wait' : 'pointer' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFile}
              disabled={avatarUploading}
            />
            {profile.avatarUrl ? (
              <img
                src={resolveUrl(profile.avatarUrl)}
                alt={profile.displayName}
                style={{
                  width: 100, height: 100, borderRadius: '50%', objectFit: 'cover',
                  border: '3px solid var(--border-color)',
                  opacity: avatarUploading ? 0.5 : 1,
                }}
              />
            ) : (
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#472552',
                border: '3px solid var(--border-color)',
                opacity: avatarUploading ? 0.5 : 1,
              }}>
                {avatarUploading ? '...' : initials}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              background: 'var(--surface-2)', borderRadius: '50%',
              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, border: '2px solid var(--border-color)',
            }}>✎</div>
          </label>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)' }}>
              {profile.displayName}
            </div>
            <div style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>@{profile.username}</div>
            {profile.isVip && (
              <img
                src="/vip-badge.png"
                alt="VIP"
                style={{ width: 70, height: 'auto', margin: 'var(--space-2) auto 0' }}
              />
            )}
            {!profile.isVip && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/vip')}
                style={{ marginTop: 'var(--space-3)', background: 'var(--color-primary)', color: '#472552' }}
              >
                Upgrade to VIP for $9.99
              </button>
            )}
            {profile.isVip && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setCancelConfirmOpen(true)}
                disabled={cancelLoading}
                style={{ marginTop: 'var(--space-3)', background: 'var(--color-primary)', color: '#472552' }}
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel VIP membership'}
              </button>
            )}
          </div>
        </div>

        {/* Favorites */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{
            fontSize: 'var(--font-size-sm)', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--color-primary)',
            marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)',
            borderBottom: '1px solid var(--border-color)',
            textAlign: 'center',
          }}>
            Favorites
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            {slots.map((slot, i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                {slot ? (
                  <div style={{ position: 'relative' }}>
                    <Link to={`/films/${slot.filmId}`}>
                      {slot.posterUrl ? (
                        <img
                          src={slot.posterUrl}
                          alt={slot.title}
                          style={{ width: 90, height: 134, objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: 90, height: 134, background: 'var(--surface-2)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)',
                          padding: 'var(--space-2)', textAlign: 'center',
                        }}>
                          {slot.title}
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={() => removeFavorite(slot.filmId)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.65)', color: '#fff',
                        border: 'none', borderRadius: '50%',
                        width: 22, height: 22, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, lineHeight: 1, padding: 0,
                      }}
                    >×</button>
                  </div>
                ) : (
                  <div
                    onClick={() => openPicker(i + 1)}
                    style={{
                      width: 90, height: 134,
                      border: '2px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', fontSize: 'var(--font-size-xl)',
                      cursor: 'pointer',
                    }}
                  >+</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vertical nav */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-12)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: 280 }}>
            <Link to="/watched" className="btn btn-ghost" style={{ textAlign: 'center' }}>Watched</Link>
            <Link to="/diary" className="btn btn-ghost" style={{ textAlign: 'center' }}>Diary</Link>
            <Link to="/liked" className="btn btn-ghost" style={{ textAlign: 'center' }}>Liked</Link>
            <Link to="/watchlist" className="btn btn-ghost" style={{ textAlign: 'center' }}>Watchlist</Link>
            <Link to="/friends" className="btn btn-ghost" style={{ textAlign: 'center' }}>Friends</Link>
          </div>
        </div>
      </div>

      {cancelConfirmOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 'var(--space-6)',
          }}
          onClick={() => setCancelConfirmOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-overlay)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              maxWidth: 380, width: '100%',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)', color: 'var(--color-primary)' }}>
                Cancel VIP membership?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Are you sure you want to cancel your VIP membership? You will lose your VIP status immediately.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Keep VIP
              </button>
              <button
                className="btn btn-sm"
                onClick={handleCancelVip}
                style={{ background: 'var(--color-primary)', color: '#472552', fontWeight: 700 }}
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Film picker modal */}
      {pickerOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 'var(--space-6)',
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)', maxWidth: 600, width: '100%',
              maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>Pick a Favorite</h3>
            <input
              type="text"
              placeholder="Search watched films..."
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              autoFocus
            />
            <div style={{ overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {filteredWatched.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>
                  {watchedFilms.length === 0 ? 'No watched films yet.' : 'No results.'}
                </p>
              ) : (
                filteredWatched.map(f => (
                  <div
                    key={f.id}
                    style={{ cursor: 'pointer', textAlign: 'center', width: 80 }}
                    onClick={() => selectFilm(f)}
                  >
                    {f.posterUrl ? (
                      <img
                        src={f.posterUrl}
                        alt={f.title}
                        style={{ width: 80, height: 119, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        width: 80, height: 119, background: 'var(--surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', padding: 4,
                      }}>
                        {f.title}
                      </div>
                    )}
                    <div style={{
                      fontSize: 'var(--font-size-xs)', marginTop: 4,
                      color: 'var(--color-primary)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {f.title}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPickerOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
