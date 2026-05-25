import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import NavBar from '../components/NavBar';

const API_ORIGIN = new URL(api.defaults.baseURL!).origin;
const resolveUrl = (url?: string) =>
  url?.startsWith('/') ? `${API_ORIGIN}${url}` : url;

function UserAvatar({ avatarUrl, displayName, size = 36 }: { avatarUrl?: string; displayName: string; size?: number }) {
  const initials = displayName.slice(0, 2).toUpperCase();
  return avatarUrl ? (
    <img
      src={resolveUrl(avatarUrl)}
      alt={displayName}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#472552',
    }}>
      {initials}
    </div>
  );
}

type Tab = 'my-friends' | 'add-friends';

interface Friend {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  friendsSince: string;
}

interface PendingRequest {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

type Relation = 'None' | 'PendingSent' | 'PendingReceived' | 'Friends';

interface SearchResult {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  relation: Relation;
  requestId: string | null;
}

export default function FriendsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('my-friends');

  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tab !== 'my-friends') return;
    setLoadingFriends(true);
    Promise.all([
      api.get<Friend[]>('/friends'),
      api.get<PendingRequest[]>('/friends/pending'),
    ])
      .then(([fr, pr]) => {
        setFriends(fr.data);
        setPending(pr.data);
      })
      .finally(() => setLoadingFriends(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'add-friends') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      api.get<SearchResult[]>('/friends/search', { params: { username: searchQuery.trim() } })
        .then(res => setSearchResults(res.data))
        .finally(() => setSearching(false));
    }, 400);
  }, [searchQuery, tab]);

  const sendRequest = async (username: string) => {
    setActionLoading(username);
    try {
      await api.post(`/friends/request/${encodeURIComponent(username)}`);
      setSearchResults(prev =>
        prev.map(r => r.username === username ? { ...r, relation: 'PendingSent' } : r)
      );
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  const removeFriend = async (friendUserId: string) => {
    setRemoveLoading(friendUserId);
    try {
      await api.delete(`/friends/${friendUserId}`);
      setFriends(prev => prev.filter(f => f.userId !== friendUserId));
      setSearchResults(prev =>
        prev.map(r => r.userId === friendUserId ? { ...r, relation: 'None', requestId: null } : r)
      );
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to remove friend');
    } finally {
      setRemoveLoading(null);
    }
  };

  const acceptRequest = async (requestId: string, requesterUsername: string) => {
    setActionLoading(requestId);
    try {
      await api.post(`/friends/accept/${requestId}`);
      setPending(prev => prev.filter(r => r.id !== requestId));
      const [fr] = await Promise.all([api.get<Friend[]>('/friends')]);
      setFriends(fr.data);
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: 'var(--space-2) var(--space-6)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-base)',
    fontWeight: active ? 600 : 400,
    transition: 'color 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <NavBar />
        <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-6)' }}>Friends</h1>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-6)' }}>
          <button style={tabStyle(tab === 'my-friends')} onClick={() => setTab('my-friends')}>
            My Friends
            {pending.length > 0 && tab !== 'my-friends' && (
              <span style={{
                marginLeft: 'var(--space-2)',
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: '999px',
                padding: '1px 7px',
                fontSize: '12px',
              }}>{pending.length}</span>
            )}
          </button>
          <button style={tabStyle(tab === 'add-friends')} onClick={() => setTab('add-friends')}>
            Add Friends
          </button>
        </div>

        {tab === 'my-friends' && (
          <div>
            {loadingFriends ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : (
              <>
                {pending.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-8)' }}>
                    <h3 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
                      Pending requests ({pending.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {pending.map(req => (
                        <div key={req.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)' }}>
                          <Link to={`/users/${req.username}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <UserAvatar avatarUrl={req.avatarUrl} displayName={req.displayName} />
                            <span>
                              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.displayName}</span>
                              <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>@{req.username}</span>
                            </span>
                          </Link>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequest(req.id, req.username)}
                            disabled={actionLoading === req.id}
                          >
                            {actionLoading === req.id ? 'Accepting...' : 'Accept'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
                  Friends ({friends.length})
                </h3>
                {friends.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    No friends yet. Go to{' '}
                    <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }} onClick={() => setTab('add-friends')}>
                      Add Friends
                    </button>{' '}
                    to find people to follow.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {friends.map(f => (
                      <div key={f.userId} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)' }}>
                        <Link to={`/users/${f.username}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <UserAvatar avatarUrl={f.avatarUrl} displayName={f.displayName} />
                          <span>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{f.displayName}</span>
                            <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>@{f.username}</span>
                          </span>
                        </Link>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => removeFriend(f.userId)}
                          disabled={removeLoading === f.userId}
                        >
                          {removeLoading === f.userId ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'add-friends' && (
          <div>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', marginBottom: 'var(--space-6)' }}
              autoFocus
            />

            {searching && <p style={{ color: 'var(--text-muted)' }}>Searching...</p>}

            {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No users found.</p>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {searchResults.map(r => (
                  <div key={r.userId} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)' }}>
                    <Link to={`/users/${r.username}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <UserAvatar avatarUrl={r.avatarUrl} displayName={r.displayName} />
                      <span>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{r.displayName}</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>@{r.username}</span>
                      </span>
                    </Link>
                    <RelationButton
                      relation={r.relation}
                      loading={actionLoading === r.username}
                      removing={removeLoading === r.userId}
                      onSend={() => sendRequest(r.username)}
                      onRemove={() => removeFriend(r.userId)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RelationButton({ relation, loading, removing, onSend, onRemove }: {
  relation: Relation;
  loading: boolean;
  removing: boolean;
  onSend: () => void;
  onRemove: () => void;
}) {
  if (relation === 'Friends') {
    return (
      <button
        className="btn btn-primary btn-sm"
        onClick={onRemove}
        disabled={removing}
      >
        {removing ? 'Removing...' : 'Remove'}
      </button>
    );
  }
  if (relation === 'PendingSent') {
    return (
      <button className="btn btn-ghost btn-sm" disabled>
        Pending
      </button>
    );
  }
  if (relation === 'PendingReceived') {
    return <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Check My Friends</span>;
  }
  return (
    <button className="btn btn-primary btn-sm" onClick={onSend} disabled={loading}>
      {loading ? 'Sending...' : 'Add Friend'}
    </button>
  );
}
