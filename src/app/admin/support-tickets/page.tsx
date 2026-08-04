'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminGuard from '../components/AdminGuard';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { SupportTicket } from '@/lib/types';

const TICKET_STATUSES: SupportTicket['status'][] = ['New', 'Open', 'Waiting for Customer', 'Resolved', 'Closed'];

const STATUS_COLORS: Record<string, string> = {
  'New': '#8b5cf6',
  'Open': '#3b82f6',
  'Waiting for Customer': '#f59e0b',
  'Resolved': '#10b981',
  'Closed': '#6b7280',
};

function TicketRow({ ticket, onSelect }: { ticket: SupportTicket; onSelect: (t: SupportTicket) => void }) {
  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onClick={() => onSelect(ticket)}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--foreground-subtle)' }}>
        {ticket.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
        {ticket.name}
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground-muted)' }}>
        {ticket.tiktok_handle ? `@${ticket.tiktok_handle}` : '—'}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground-muted)' }}>
        {ticket.subject}
      </td>
      <td className="px-4 py-3">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{
            background: `${STATUS_COLORS[ticket.status] ?? '#6b7280'}22`,
            color: STATUS_COLORS[ticket.status] ?? '#6b7280',
            border: `1px solid ${STATUS_COLORS[ticket.status] ?? '#6b7280'}44`,
          }}
        >
          {ticket.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
        {new Date(ticket.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
      </td>
    </tr>
  );
}

function TicketDetailModal({ ticket, onClose, onUpdate }: {
  ticket: SupportTicket;
  onClose: () => void;
  onUpdate: (updated: SupportTicket) => void;
}) {
  const [status, setStatus] = useState<SupportTicket['status']>(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const supabase = createClient();
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      const { data, error: err } = await supabase
        .from('support_tickets')
        .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)
        .select()
        .single();
      if (err) throw err;

      // Audit log
      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: 'TICKET_UPDATED',
        module: 'Support Tickets',
        target_ref: ticket.id,
        prev_value: ticket.status,
        new_value: status,
        explanation: `Updated ticket status to ${status}. Notes: ${adminNotes.slice(0, 100)}`,
      });

      onUpdate(data as SupportTicket);
      onClose();
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Ticket #{ticket.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
              {new Date(ticket.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-subtle)' }}>Name</p>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{ticket.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-subtle)' }}>TikTok Handle</p>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {ticket.tiktok_handle ? `@${ticket.tiktok_handle}` : '—'}
              </p>
            </div>
          </div>

          {/* Subject */}
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-subtle)' }}>Subject</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{ticket.subject}</p>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-subtle)' }}>Message</p>
            <div
              className="rounded-xl p-4 text-sm leading-relaxed"
              style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
            >
              {ticket.message}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {TICKET_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={{
                    background: status === s ? `${STATUS_COLORS[s]}22` : 'var(--muted)',
                    color: status === s ? STATUS_COLORS[s] : 'var(--foreground-muted)',
                    border: `1px solid ${status === s ? STATUS_COLORS[s] + '66' : 'var(--border)'}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
              Admin Notes / Reply
            </label>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              className="input-field text-sm resize-none w-full"
              placeholder="Add notes, reply details, or internal comments..."
            />
          </div>

          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-ghost text-sm px-5 py-2.5 rounded-xl">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm px-6 py-2.5"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Changes ✦'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSupportTicketsContent() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTickets((data ?? []) as SupportTicket[]);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const filtered = tickets.filter(t => {
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !search || t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || (t.tiktok_handle ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = TICKET_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  const handleUpdate = (updated: SupportTicket) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  return (
    <AdminLayout title="Support Tickets">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TICKET_STATUSES.map(s => (
            <div
              key={s}
              className="rounded-xl p-3 text-center cursor-pointer transition-all"
              style={{
                background: statusFilter === s ? `${STATUS_COLORS[s]}15` : 'var(--background-card)',
                border: `1px solid ${statusFilter === s ? STATUS_COLORS[s] + '44' : 'var(--border)'}`,
              }}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            >
              <p className="font-display text-xl font-bold" style={{ color: STATUS_COLORS[s] }}>{counts[s] ?? 0}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>{s}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <input
            type="search"
            placeholder="Search by name, subject, handle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>

        {/* Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--background-card)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-3xl mb-3">✦</span>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No tickets found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Ticket ID</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>TikTok</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Subject</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ticket => (
                    <TicketRow key={ticket.id} ticket={ticket} onSelect={setSelectedTicket} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdate}
        />
      )}
    </AdminLayout>
  );
}

export default function AdminSupportTicketsPage() {
  return (
    <AdminGuard>
      <AdminSupportTicketsContent />
    </AdminGuard>
  );
}
