import { useEffect, useRef, useState } from 'react';

interface Props {
  genres: string[];
  value: string;
  onChange: (genre: string) => void;
}

export default function GenreSelect({ genres, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = value || 'All genres';

  return (
    <div ref={ref} style={{ position: 'relative', width: 180, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'var(--bg-elevated)',
          color: 'var(--color-primary)',
          border: `1px solid ${open ? 'var(--color-primary)' : 'var(--bg-overlay)'}`,
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: open ? 'var(--shadow-glow-primary)' : 'none',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-overlay)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          maxHeight: 260,
          overflowY: 'auto',
          listStyle: 'none',
          padding: 'var(--space-1)',
        }}>
          {['', ...genres].map(g => (
            <GenreOption
              key={g || '__all__'}
              label={g || 'All genres'}
              selected={value === g}
              onClick={() => { onChange(g); setOpen(false); }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function GenreOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <li
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        color: selected ? 'var(--text-inverse)' : hovered ? 'var(--text-inverse)' : 'var(--text-primary)',
        background: selected
          ? 'var(--color-primary)'
          : hovered
          ? 'var(--color-primary)'
          : 'transparent',
        transition: 'background var(--transition-fast), color var(--transition-fast)',
      }}
    >
      {label}
    </li>
  );
}
