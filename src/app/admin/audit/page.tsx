'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/ui/AppIcon';

interface AuditLog {
  id: string;
  admin_handle: string;
  action: string;
  module: string;
  target_ref: string;
  reason: string;
  notes: string;
  explanation: string;
  prev_value: string;
  new_value: string;
  created_at: string;
}

function AuditLogContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (moduleFilter) query = query.eq('module', moduleFilter);

      const { data } = await query;
      setLogs((data ?? []) as AuditLog[]);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.admin_handle?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.module?.toLowerCase().includes(q) ||
      l.target_ref?.toLowerCase().includes(q) ||
      l.notes?.toLowerCase().includes(q) ||
      l.explanation?.toLowerCase().includes(q)
    );
  });

  const modules = [...new Set(logs.map(l => l.module).filter(Boolean))];

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  const ACTION_COLORS: Record<string, string> = {
    'PAYMENT_CONFIRMED': '#10b981',
    'ORDER_REFUNDED': '#ef4444',
    'ORDER_STATUS_CHANGED': '#3b82f6',
    'PROCESSING_STATUS_CHANGED': '#8b5cf6',
    'WAYBILL_UPDATED': '#f97316',
    'TRACKING_LINK_UPDATED': '#06b6d4',
    'ORDER_NOTES_UPDATED': '#a78bfa',
    'STORE_CREDIT_ISSUED': '#10b981',
    'STORE_CREDIT_ACTIVATED': '#10b981',
    'STORE_CREDIT_DEACTIVATED': '#f59e0b',
    'STORE_CREDIT_CANCELLED': '#ef4444',
    'STORE_CREDIT_REASON_UPDATED': '#3b82f6',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Audit Log</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Immutable record of all admin actions. Cannot be edited or deleted.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
          >
            <Icon name="ArrowPathIcon" size={12} />
            Refresh
          </button>
          <div
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            {filtered.length} records
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <input
            type="search"
            placeholder="Search by admin, action, module, target, notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
          className="select-field text-sm"
          style={{ minWidth: '160px' }}
        >
          <option value="">All Modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <Icon name="ClipboardDocumentListIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No audit records found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <div
              key={log.id}
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--primary-bright)' }}>{log.admin_handle}</span>
                    {log.module && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.25)' }}>
                        {log.module}
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: `${ACTION_COLORS[log.action] ?? '#6b7280'}15`,
                        color: ACTION_COLORS[log.action] ?? 'var(--foreground)',
                      }}
                    >
                      {log.action}
                    </span>
                    {log.target_ref && (
                      <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>→ {log.target_ref}</span>
                    )}
                    {log.notes && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        has notes
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{formatDate(log.created_at)}</p>
                </div>
                <Icon name={expandedId === log.id ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} style={{ color: 'var(--foreground-subtle)', flexShrink: 0 } as React.CSSProperties} />
              </button>

              {expandedId === log.id && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {log.explanation && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-subtle)' }}>Action Description</p>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{log.explanation}</p>
                      </div>
                    )}
                    {log.notes && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>Admin Notes</p>
                        <div className="rounded-lg p-2.5 text-xs" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--foreground-muted)' }}>
                          {log.notes}
                        </div>
                      </div>
                    )}
                    {log.reason && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-subtle)' }}>Reason</p>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{log.reason}</p>
                      </div>
                    )}
                    {log.prev_value && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-subtle)' }}>Previous Value</p>
                        <p className="text-xs font-mono" style={{ color: '#f87171' }}>{log.prev_value}</p>
                      </div>
                    )}
                    {log.new_value && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-subtle)' }}>New Value</p>
                        <p className="text-xs font-mono" style={{ color: '#10b981' }}>{log.new_value}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAuditPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Audit Log">
        <AuditLogContent />
      </AdminLayout>
    </AdminGuard>
  );
}
