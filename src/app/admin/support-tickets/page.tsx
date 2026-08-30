'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminGuard from '../components/AdminGuard';
import Icon from '@/components/ui/AppIcon';
import SearchHintDropdown from '@/components/ui/SearchHintDropdown';
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

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

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

  // Reply thread state
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      setMessages((data ?? []) as TicketMessage[]);
    } catch {
      // silently fail
    } finally {
      setLoadingMessages(false);
    }
  }, [ticket.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (!loadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    setReplyError('');
    try {
      const supabase = createClient();
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      const adminName = session.display_name || session.tiktok_handle || 'Admin';

      const { data: newMsg, error: msgErr } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_type: 'admin',
          sender_name: adminName,
          message: replyText.trim(),
        })
        .select()
        .single();
      if (msgErr) throw msgErr;

      setMessages(prev => [...prev, newMsg as TicketMessage]);
      setReplyText('');

      // Auto-set status to Open if it was New
      if (status === 'New') {
        setStatus('Open');
      }
    } catch {
      setReplyError('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

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
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in-up flex flex-col"
        style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
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

        <div className="overflow-y-auto flex-1">
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

            {/* Reply Thread */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-subtle)' }}>
                Conversation Thread
              </p>

              {/* Original message as first bubble */}
              <div className="space-y-3 mb-3">
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)' }}
                  >
                    {ticket.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{ticket.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--primary-bright)', fontSize: '10px' }}>Customer</span>
                      <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{formatDateTime(ticket.created_at)}</span>
                    </div>
                    <div
                      className="rounded-xl rounded-tl-sm p-3 text-sm leading-relaxed"
                      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: 'var(--foreground-muted)' }}
                    >
                      {ticket.message}
                    </div>
                  </div>
                </div>

                {/* Thread messages */}
                {loadingMessages ? (
                  <div className="flex justify-center py-3">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          background: msg.sender_type === 'admin' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                          color: msg.sender_type === 'admin' ? '#10b981' : 'var(--primary-bright)',
                        }}
                      >
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`flex-1 ${msg.sender_type === 'admin' ? 'items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${msg.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{msg.sender_name}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              background: msg.sender_type === 'admin' ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
                              color: msg.sender_type === 'admin' ? '#10b981' : 'var(--primary-bright)',
                              fontSize: '10px',
                            }}
                          >
                            {msg.sender_type === 'admin' ? 'Admin' : 'Customer'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{formatDateTime(msg.created_at)}</span>
                        </div>
                        <div
                          className={`rounded-xl p-3 text-sm leading-relaxed ${msg.sender_type === 'admin' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                          style={{
                            background: msg.sender_type === 'admin' ? 'rgba(16,185,129,0.08)' : 'rgba(139,92,246,0.08)',
                            border: `1px solid ${msg.sender_type === 'admin' ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.15)'}`,
                            color: 'var(--foreground-muted)',
                          }}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Admin reply input */}
              <div
                className="rounded-xl p-3"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); setReplyError(''); }}
                  className="input-field text-sm resize-none w-full mb-2"
                  placeholder="Type your reply to the customer..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                {replyError && <p className="text-xs mb-2" style={{ color: '#f87171' }}>{replyError}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Ctrl+Enter to send</p>
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                    style={{ opacity: (sendingReply || !replyText.trim()) ? 0.6 : 1 }}
                  >
                    <Icon name="PaperAirplaneIcon" size={13} />
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
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

            {/* Admin Notes (internal) */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
                Internal Notes (not visible to customer)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                className="input-field text-sm resize-none w-full"
                placeholder="Add internal notes or comments..."
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
    </div>
  );
}

function AdminSupportTicketsContent() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="input-field pl-9 text-sm"
          />
          {searchFocused && (
            <SearchHintDropdown hints={[
              { label: 'Name', icon: 'IdentificationIcon' },
              { label: 'Subject', icon: 'ChatBubbleLeftIcon' },
              { label: 'TikTok Handle', icon: 'UserIcon' },
            ]} />
          )}
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
