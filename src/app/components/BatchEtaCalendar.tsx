'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface BatchEtaEntry {
  batch: string;
  eta: string; // ISO date string
  etaVisible: boolean;
  count: number;
}

interface Props {
  batches: BatchEtaEntry[];
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BatchEtaCalendar({ batches }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const visibleBatches = batches.filter(b => b.etaVisible && b.eta);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  // Map batch ETAs to day numbers for this month
  const batchDayMap: Record<number, BatchEtaEntry[]> = {};
  for (const b of visibleBatches) {
    const d = new Date(b.eta);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!batchDayMap[day]) batchDayMap[day] = [];
      batchDayMap[day].push(b);
    }
  }

  const todayDay = today.getFullYear() === viewYear && today.getMonth() === viewMonth ? today.getDate() : null;

  if (visibleBatches.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(251,245,236,0.22)',
        border: '1px solid rgba(200,164,91,0.35)',
        boxShadow: '0 4px 24px rgba(75,53,42,0.10)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(200,164,91,0.25)', background: 'rgba(200,164,91,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <Icon name="CalendarIcon" size={16} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
          <h3 className="font-display text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            Batch ETA Calendar
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(200,164,91,0.15)', color: 'var(--primary-bright)', border: '1px solid rgba(200,164,91,0.3)' }}
            aria-label="Previous month"
          >
            <Icon name="ChevronLeftIcon" size={14} />
          </button>
          <span className="text-sm font-semibold min-w-[130px] text-center" style={{ color: 'var(--foreground)' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(200,164,91,0.15)', color: 'var(--primary-bright)', border: '1px solid rgba(200,164,91,0.3)' }}
            aria-label="Next month"
          >
            <Icon name="ChevronRightIcon" size={14} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center py-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--foreground-subtle)', fontSize: '0.65rem', letterSpacing: '0.06em' }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            const batchesOnDay = day ? (batchDayMap[day] ?? []) : [];
            const isToday = day === todayDay;
            const hasBatch = batchesOnDay.length > 0;

            return (
              <div
                key={idx}
                className="relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg"
                style={{
                  background: hasBatch
                    ? 'rgba(200,164,91,0.18)'
                    : isToday
                    ? 'rgba(139,92,246,0.12)'
                    : 'transparent',
                  border: hasBatch
                    ? '1.5px solid rgba(200,164,91,0.5)'
                    : isToday
                    ? '1px solid rgba(139,92,246,0.35)'
                    : '1px solid transparent',
                }}
              >
                {day && (
                  <>
                    <span
                      className="text-xs font-semibold leading-none"
                      style={{
                        color: hasBatch ? 'var(--primary-bright)' : isToday ? '#a78bfa' : 'var(--foreground-muted)',
                        fontSize: '0.7rem',
                      }}
                    >
                      {day}
                    </span>
                    {hasBatch && (
                      <div className="mt-0.5 flex flex-col items-center gap-0.5 w-full px-0.5">
                        {batchesOnDay.slice(0, 2).map((b, bi) => (
                          <span
                            key={bi}
                            className="block w-full text-center rounded truncate"
                            style={{
                              background: 'rgba(200,164,91,0.35)',
                              color: '#3A2214',
                              fontSize: '0.5rem',
                              padding: '0.05rem 0.15rem',
                              fontWeight: 700,
                              lineHeight: 1.3,
                            }}
                            title={b.batch}
                          >
                            {b.batch.length > 8 ? b.batch.slice(0, 8) + '…' : b.batch}
                          </span>
                        ))}
                        {batchesOnDay.length > 2 && (
                          <span className="text-xs" style={{ color: 'var(--primary-bright)', fontSize: '0.5rem' }}>
                            +{batchesOnDay.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Batch legend */}
        {Object.keys(batchDayMap).length > 0 && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(200,164,91,0.2)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.08em' }}>
              BATCHES THIS MONTH
            </p>
            <div className="space-y-1.5">
              {Object.entries(batchDayMap).map(([day, batchList]) =>
                batchList.map((b, i) => (
                  <div key={`${day}-${i}`} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: 'var(--primary-bright)' }}
                      />
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{b.batch}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ color: 'var(--foreground-muted)' }}>
                        {MONTH_NAMES[viewMonth].slice(0, 3)} {day}
                      </span>
                      <span style={{ color: 'var(--foreground-subtle)' }}>{b.count} titles</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {Object.keys(batchDayMap).length === 0 && (
          <p className="text-xs text-center mt-3" style={{ color: 'var(--foreground-subtle)' }}>
            No batch ETAs scheduled for this month.{' '}
            <button
              onClick={nextMonth}
              className="underline"
              style={{ color: 'var(--primary-bright)' }}
            >
              Check next month →
            </button>
          </p>
        )}

        <div className="mt-3 flex justify-end">
          <Link href="/preorder-list" className="text-xs font-semibold" style={{ color: 'var(--primary-bright)' }}>
            View all preorders →
          </Link>
        </div>
      </div>
    </div>
  );
}
