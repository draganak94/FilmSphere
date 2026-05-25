import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  max?: string;
  onChange: (value: string) => void;
}

type CalView = 'days' | 'months' | 'years';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const YEAR_PAGE = 12;

function parseDate(str: string) {
  const [y, m, d] = str.split('-').map(Number);
  return { year: y, month: m, day: d };
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(str: string) {
  if (!str) return '';
  const { year, month, day } = parseDate(str);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

const navBtn = (disabled = false): React.CSSProperties => ({
  color: disabled ? 'var(--text-muted)' : 'var(--color-primary)',
  fontSize: 16,
  padding: '1px 6px',
  borderRadius: 'var(--radius-sm)',
  cursor: disabled ? 'default' : 'pointer',
  transition: 'background var(--transition-fast)',
});

export default function DatePickerInput({ value, max, onChange }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const initial = value ? parseDate(value) : parseDate(today);

  const [open, setOpen] = useState(false);
  const [calView, setCalView] = useState<CalView>('days');
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [yearPageStart, setYearPageStart] = useState(() => Math.floor(initial.year / YEAR_PAGE) * YEAR_PAGE);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCalView('days');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const maxP = max ? parseDate(max) : null;

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const canNextMonth = !maxP || viewYear < maxP.year || (viewYear === maxP.year && viewMonth < maxP.month);

  const selectDay = (day: number) => {
    const str = toDateStr(viewYear, viewMonth, day);
    if (max && str > max) return;
    onChange(str);
    setOpen(false);
    setCalView('days');
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selected = value ? parseDate(value) : null;
  const todayP = parseDate(today);

  const canNextYear = !maxP || viewYear < maxP.year;
  const selectMonth = (m: number) => {
    setViewMonth(m);
    setCalView('days');
  };
  const isMonthDisabled = (m: number) =>
    !!maxP && (viewYear > maxP.year || (viewYear === maxP.year && m > maxP.month));

  const years = Array.from({ length: YEAR_PAGE }, (_, i) => yearPageStart + i);
  const canNextYearPage = !maxP || yearPageStart + YEAR_PAGE <= maxP.year;
  const selectYear = (y: number) => {
    setViewYear(y);
    setYearPageStart(Math.floor(y / YEAR_PAGE) * YEAR_PAGE);
    setCalView('months');
  };
  const isYearDisabled = (y: number) => !!maxP && y > maxP.year;

  const openHeaderLabel = () => {
    if (calView === 'days') {
      setYearPageStart(Math.floor(viewYear / YEAR_PAGE) * YEAR_PAGE);
      setCalView('months');
    } else if (calView === 'months') {
      setYearPageStart(Math.floor(viewYear / YEAR_PAGE) * YEAR_PAGE);
      setCalView('years');
    } else {
      setCalView('days');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          background: 'var(--bg-elevated)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          border: '1px solid var(--bg-overlay)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          textAlign: 'left',
          fontSize: 'var(--font-size-md)',
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          ...(open ? { borderColor: 'var(--color-primary)', boxShadow: 'var(--shadow-glow-primary)' } : {}),
        }}
      >
        <span>{value ? formatDisplay(value) : 'Select date'}</span>
        <span style={{ color: 'var(--color-primary)', fontSize: 16 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 200,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            padding: '10px 12px',
            userSelect: 'none',
          }}
        >
          {calView === 'days' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <button type="button" onClick={prevMonth} style={navBtn()}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(165,210,181,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>‹</button>

                <button type="button" onClick={openHeaderLabel} style={{
                  fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-xs)',
                  padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition-fast)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(165,210,181,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {MONTHS[viewMonth - 1]} {viewYear} ▾
                </button>

                <button type="button" onClick={canNextMonth ? nextMonth : undefined} style={navBtn(!canNextMonth)}
                  onMouseEnter={e => { if (canNextMonth) e.currentTarget.style.background = 'rgba(165,210,181,0.12)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '1px 0' }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {cells.map((day, i) => {
                  if (day === null) return <div key={i} />;
                  const cellStr = toDateStr(viewYear, viewMonth, day);
                  const isSel = selected && selected.year === viewYear && selected.month === viewMonth && selected.day === day;
                  const isTod = todayP.year === viewYear && todayP.month === viewMonth && todayP.day === day;
                  const isDis = max ? cellStr > max : false;
                  return (
                    <button key={i} type="button"
                      onClick={() => !isDis && selectDay(day)}
                      style={{
                        boxSizing: 'border-box', textAlign: 'center', padding: '3px 0',
                        borderRadius: 'var(--radius-sm)', fontSize: 11,
                        fontWeight: isSel || isTod ? 700 : 400,
                        cursor: isDis ? 'default' : 'pointer',
                        color: isDis ? 'var(--text-muted)' : isSel ? 'var(--text-inverse)' : isTod ? 'var(--color-primary)' : 'var(--text-primary)',
                        background: isSel ? 'var(--color-primary)' : 'transparent',
                        border: isTod && !isSel ? '1px solid var(--color-primary)' : '1px solid transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={e => { if (!isDis && !isSel) e.currentTarget.style.background = 'rgba(165,210,181,0.15)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >{day}</button>
                  );
                })}
              </div>
            </>
          )}

          {calView === 'months' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <button type="button" onClick={() => setViewYear(y => y - 1)} style={navBtn()}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(165,210,181,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>‹</button>

                <button type="button" onClick={openHeaderLabel} style={{
                  fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-xs)',
                  padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition-fast)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(165,210,181,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {viewYear} ▾
                </button>

                <button type="button" onClick={canNextYear ? () => setViewYear(y => y + 1) : undefined} style={navBtn(!canNextYear)}
                  onMouseEnter={e => { if (canNextYear) e.currentTarget.style.background = 'rgba(165,210,181,0.12)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {MONTHS_SHORT.map((name, i) => {
                  const m = i + 1;
                  const isDis = isMonthDisabled(m);
                  const isSel = selected && selected.year === viewYear && selected.month === m;
                  return (
                    <button key={m} type="button"
                      onClick={() => !isDis && selectMonth(m)}
                      style={{
                        boxSizing: 'border-box', textAlign: 'center', padding: '5px 0',
                        borderRadius: 'var(--radius-sm)', fontSize: 11,
                        fontWeight: isSel ? 700 : 400,
                        cursor: isDis ? 'default' : 'pointer',
                        color: isDis ? 'var(--text-muted)' : isSel ? 'var(--text-inverse)' : 'var(--text-primary)',
                        background: isSel ? 'var(--color-primary)' : 'transparent',
                        border: '1px solid transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={e => { if (!isDis && !isSel) e.currentTarget.style.background = 'rgba(165,210,181,0.15)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >{name}</button>
                  );
                })}
              </div>
            </>
          )}

          {calView === 'years' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <button type="button" onClick={() => setYearPageStart(s => s - YEAR_PAGE)} style={navBtn()}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(165,210,181,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>‹</button>

                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-xs)' }}>
                  {yearPageStart} – {yearPageStart + YEAR_PAGE - 1}
                </span>

                <button type="button" onClick={canNextYearPage ? () => setYearPageStart(s => s + YEAR_PAGE) : undefined} style={navBtn(!canNextYearPage)}
                  onMouseEnter={e => { if (canNextYearPage) e.currentTarget.style.background = 'rgba(165,210,181,0.12)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {years.map(y => {
                  const isDis = isYearDisabled(y);
                  const isSel = selected && selected.year === y;
                  return (
                    <button key={y} type="button"
                      onClick={() => !isDis && selectYear(y)}
                      style={{
                        boxSizing: 'border-box', textAlign: 'center', padding: '5px 0',
                        borderRadius: 'var(--radius-sm)', fontSize: 11,
                        fontWeight: isSel ? 700 : 400,
                        cursor: isDis ? 'default' : 'pointer',
                        color: isDis ? 'var(--text-muted)' : isSel ? 'var(--text-inverse)' : 'var(--text-primary)',
                        background: isSel ? 'var(--color-primary)' : 'transparent',
                        border: '1px solid transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={e => { if (!isDis && !isSel) e.currentTarget.style.background = 'rgba(165,210,181,0.15)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >{y}</button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
