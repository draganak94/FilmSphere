import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import FilmCard, { Film } from '../components/FilmCard';

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
  favorites: FavoriteFilm[];
}

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

function groupByMonth(entries: DiaryEntry[]) {
  const map = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const date = entry.watchedDate ? new Date(entry.watchedDate) : null;
    const label = date
      ? date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      : 'Unknown date';
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }));
}

type Section = 'watched' | 'diary' | 'liked' | 'watchlist' | 'friends' | null;

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>(null);

  const [diary, setDiary] = useState<DiaryEntry[] | null>(null);
  const [watched, setWatched] = useState<Film[] | null>(null);
  const [liked, setLiked] = useState<Film[] | null>(null);
  const [watchlist, setWatchlist] = useState<Film[] | null>(null);
  const [sectionLoading, setSectionLoading] = useState(false);

  useEffect(() => {
    api.get<Profile>(`/profile/${username}`)
      .then(res => setProfile(res.data))
      .catch(err => setError(err.response?.status === 404 ? 'User not found.' : 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [username]);

  const toggleSection = async (section: Section) => {
    if (activeSection === section) { setActiveSection(null); return; }
    setActiveSection(section);
    if (section === 'friends') return;

    const alreadyLoaded =
      (section === 'diary' && diary !== null) ||
      (section === 'watched' && watched !== null) ||
      (section === 'liked' && liked !== null) ||
      (section === 'watchlist' && watchlist !== null);
    if (alreadyLoaded) return;

    setSectionLoading(true);
    try {
      if (section === 'diary') {
        const r = await api.get<DiaryEntry[]>(`/profile/${username}/diary`);
        setDiary(r.data);
      } else if (section === 'watched') {
        const r = await api.get<Film[]>(`/profile/${username}/watched`);
        setWatched(r.data);
      } else if (section === 'liked') {
        const r = await api.get<Film[]>(`/profile/${username}/liked`);
        setLiked(r.data);
      } else if (section === 'watchlist') {
        const r = await api.get<Film[]>(`/profile/${username}/watchlist`);
        setWatchlist(r.data);
      }
    } finally {
      setSectionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (error) return <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>{error}</div>;
  if (!profile) return null;

  const initials = profile.displayName.slice(0, 2).toUpperCase();
  const slots: (FavoriteFilm | null)[] = Array(5).fill(null);
  profile.favorites.forEach(f => { slots[f.sortOrder - 1] = f; });

  const btnStyle = (active: boolean): React.CSSProperties => ({
    textAlign: 'center' as const,
    width: '100%',
    background: active ? 'var(--color-primary)' : undefined,
    color: active ? '#fff' : undefined,
  });

  const filmGrid = (films: Film[]) => (
    films.length === 0
      ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-4)' }}>No films here yet.</p>
      : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
          {films.map(f => <FilmCard key={f.id} film={f} />)}
        </div>
  );

  const diaryGroups = diary ? groupByMonth(diary) : [];

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <NavBar />

        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-color)' }}
            />
          ) : (
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#fff',
              border: '3px solid var(--border-color)',
            }}>
              {initials}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>{profile.displayName}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>@{profile.username}</div>
          </div>
        </div>

        {/* Favorites */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{
            fontSize: 'var(--font-size-sm)', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--color-primary)',
            marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)',
            borderBottom: '1px solid var(--border-color)',
          }}>
            Favorites
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            {slots.map((slot, i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                {slot ? (
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
                ) : (
                  <div style={{ width: 90, height: 134, border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nav buttons — same layout as ProfilePage */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-12)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: 280 }}>
            <button className="btn btn-ghost" style={btnStyle(activeSection === 'watched')} onClick={() => toggleSection('watched')}>Watched</button>
            <button className="btn btn-ghost" style={btnStyle(activeSection === 'diary')} onClick={() => toggleSection('diary')}>Diary</button>
            <button className="btn btn-ghost" style={btnStyle(activeSection === 'liked')} onClick={() => toggleSection('liked')}>Liked</button>
            <button className="btn btn-ghost" style={btnStyle(activeSection === 'watchlist')} onClick={() => toggleSection('watchlist')}>Watchlist</button>
          </div>
        </div>

        {/* Section content */}
        {sectionLoading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-6)' }}>Loading...</p>}

        {!sectionLoading && activeSection === 'watched' && watched && filmGrid(watched)}
        {!sectionLoading && activeSection === 'liked' && liked && filmGrid(liked)}
        {!sectionLoading && activeSection === 'watchlist' && watchlist && filmGrid(watchlist)}

        {!sectionLoading && activeSection === 'diary' && diary && (
          diary.length === 0
            ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-4)' }}>No diary entries yet.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', marginTop: 'var(--space-6)' }}>
                {diaryGroups.map(group => (
                  <div key={group.label}>
                    <h2 style={{
                      fontSize: 'var(--font-size-sm)', fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'var(--color-primary)',
                      marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)',
                      borderBottom: '1px solid var(--border-color)',
                    }}>
                      {group.label}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      {group.entries.map((entry, i) => {
                        const date = entry.watchedDate ? new Date(entry.watchedDate) : null;
                        const day = date ? date.getDate() : null;
                        return (
                          <Link key={i} to={`/films/${entry.filmId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
                              <div style={{ minWidth: 36, textAlign: 'center', fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1 }}>
                                {day ?? '—'}
                              </div>
                              {entry.posterUrl
                                ? <img src={entry.posterUrl} alt={entry.title} style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                                : <div style={{ width: 36, height: 52, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                              }
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>{entry.year}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                                {entry.rating > 0 && <span style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', letterSpacing: 1 }}>{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</span>}
                                {entry.isLiked && <span style={{ color: '#e05c7a', fontSize: 'var(--font-size-sm)' }}>♥</span>}
                                {!entry.isFirstWatch && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1px 6px' }}>rewatch</span>}
                                {entry.content && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>✎</span>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
        )}

      </div>
    </div>
  );
}
