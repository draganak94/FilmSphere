import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

interface MonthGroup {
  label: string;
  entries: DiaryEntry[];
}

function groupByMonth(entries: DiaryEntry[]): MonthGroup[] {
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

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DiaryEntry[]>('/films/diary')
      .then(res => setEntries(res.data))
      .finally(() => setLoading(false));
  }, []);

  const groups = groupByMonth(entries);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <NavBar />
        <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-6)' }}>Diary</h1>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : entries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No diary entries yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {groups.map(group => (
              <div key={group.label}>
                <h2 style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-3)',
                  paddingBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  {group.label}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {group.entries.map((entry, i) => {
                    const date = entry.watchedDate ? new Date(entry.watchedDate) : null;
                    const day = date ? date.getDate() : null;
                    return (
                      <Link
                        key={i}
                        to={`/diary/${entry.filmId}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div
                          className="card"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-4)',
                            padding: 'var(--space-3) var(--space-4)',
                            transition: 'background var(--transition-fast)',
                          }}
                        >
                          <div style={{
                            minWidth: 36,
                            textAlign: 'center',
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            lineHeight: 1,
                          }}>
                            {day ?? '-'}
                          </div>

                          {entry.posterUrl ? (
                            <img
                              src={entry.posterUrl}
                              alt={entry.title}
                              style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: 36, height: 52, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-primary)' }}>
                              {entry.title}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                              {entry.year}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                            {entry.rating > 0 && (
                              <span style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', letterSpacing: 1 }}>
                                {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
                              </span>
                            )}
                            {entry.isLiked && (
                              <span style={{ color: '#e05c7a', fontSize: 'var(--font-size-sm)' }}>♥</span>
                            )}
                            {!entry.isFirstWatch && (
                              <span style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '1px 6px',
                              }}>
                                rewatch
                              </span>
                            )}
                            {entry.content && (
                              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }} title={entry.content}>✎</span>
                            )}
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
