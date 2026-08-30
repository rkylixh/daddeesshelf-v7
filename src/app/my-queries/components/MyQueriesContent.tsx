'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

// ── Types ──────────────────────────────────────────────────
interface SupportTicket {
  id: string;
  name: string;
  tiktok_handle: string;
  subject: string;
  message: string;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

type AuthStep = 'handle' | 'enter-pin' | 'create-pin' | 'tickets';

// ── Status config ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'New': '#f59e0b',
  'In Progress': '#3b82f6',
  'Open': '#3b82f6',
  'Waiting for Customer': '#f59e0b',
  'Resolved': '#10b981',
  'Closed': '#6b7280',
};

// ── PIN hash (same salt as My Orders) ─────────────────────
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'daddees-shelf-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Ticket Card with Thread ────────────────────────────────
function TicketCard({ ticket, customerHandle, customerName }: { ticket: SupportTicket; customerHandle: string; customerName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusColor = STATUS_COLORS[ticket.status] ?? '#f59e0b';

  const formatDate = (d: string) => {
    const date = new Date(d);
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  useEffect(() => {
    if (expanded && messages.length === 0 && !loadingMessages) {
      loadMessages();
    }
  }, [expanded, messages.length, loadingMessages, loadMessages]);

  useEffect(() => {
    if (expanded && !loadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, expanded, loadingMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    setReplyError('');
    try {
      const supabase = createClient();
      const { data: newMsg, error: msgErr } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_type: 'customer',
          sender_name: customerName || customerHandle,
          message: replyText.trim(),
        })
        .select()
        .single();
      if (msgErr) throw msgErr;
      setMessages(prev => [...prev, newMsg as TicketMessage]);
      setReplyText('');
    } catch {
      setReplyError('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const hasAdminReplies = messages.some(m => m.sender_type === 'admin');

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
    >
      {/* Summary row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>
              {ticket.subject}
            </span>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
            >
              {ticket.status}
            </span>
            {hasAdminReplies && (
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                ✦ Admin Replied
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            Submitted {formatDate(ticket.created_at)}
          </p>
        </div>
        <Icon
          name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
          size={16}
          style={{ color: 'var(--foreground-subtle)', flexShrink: 0 } as React.CSSProperties}
        />
      </button>

      {/* Expanded thread */}
      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-4 space-y-3">
            {/* Original message */}
            <div className="flex gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)' }}
              >
                {(customerName || customerHandle).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{customerName || `@${customerHandle}`}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--primary-bright)', fontSize: '10px' }}>You</span>
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
            ) : messages.length === 0 ? (
              <div
                className="rounded-lg p-3 text-sm text-center"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground-subtle)' }}
              >
                No replies yet — we&apos;ll get back to you soon.
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
                  <div className="flex-1">
                    <div className={`flex items-center gap-2 mb-1 ${msg.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                        {msg.sender_type === 'admin' ? "Daddee's Shelf" : msg.sender_name}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: msg.sender_type === 'admin' ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
                          color: msg.sender_type === 'admin' ? '#10b981' : 'var(--primary-bright)',
                          fontSize: '10px',
                        }}
                      >
                        {msg.sender_type === 'admin' ? 'Admin' : 'You'}
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

            {/* Customer reply input */}
            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <div
                className="rounded-xl p-3 mt-2"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); setReplyError(''); }}
                  className="input-field text-sm resize-none w-full mb-2"
                  placeholder="Reply to this ticket..."
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Auth card wrapper ──────────────────────────────────────
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            <Icon name="ArrowLeftIcon" size={13} />
            Back to Home
          </Link>
        </div>
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
            ✦ Customer Portal ✦
          </p>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--foreground)' }}>My Queries</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--foreground-muted)' }}>
            View your support tickets and reply to admin responses
          </p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 8px 40px rgba(139,92,246,0.1)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function MyQueriesContent() {
  const { customer } = useCustomerAuth();

  const [step, setStep] = useState<AuthStep>(() => customer ? 'enter-pin' : 'handle');
  const [handle, setHandle] = useState(customer?.tiktokHandle ?? '');
  const [customerName, setCustomerName] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [customerId, setCustomerId] = useState(customer?.customerId ?? '');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const newPinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customer) {
      setHandle(customer.tiktokHandle ?? '');
      setCustomerId(customer.customerId ?? '');
      if (step === 'handle') setStep('enter-pin');
    }
  }, [customer]);

  useEffect(() => {
    if (step === 'handle') handleInputRef.current?.focus();
    else if (step === 'enter-pin') pinInputRef.current?.focus();
    else if (step === 'create-pin') newPinInputRef.current?.focus();
  }, [step]);

  const handleCheckHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) { setError('TikTok Handle is required.'); return; }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const rawHandle = handle.trim().replace(/^@/, '');

      const { data: customerData } = await supabase
        .from('customers')
        .select('id, tiktok_handle, pin_hash, pin_enrolled, display_name')
        .eq('tiktok_handle', rawHandle)
        .maybeSingle();

      if (customerData) {
        setCustomerId(customerData.id);
        if (customerData.display_name) setCustomerName(customerData.display_name);
        if (!customerData.pin_enrolled || !customerData.pin_hash) {
          setStep('create-pin');
        } else {
          setStep('enter-pin');
        }
      } else {
        const { data: ticketCheck } = await supabase
          .from('support_tickets')
          .select('id, name')
          .eq('tiktok_handle', rawHandle)
          .limit(1);

        if (ticketCheck && ticketCheck.length > 0) {
          if (ticketCheck[0].name) setCustomerName(ticketCheck[0].name);
          setStep('create-pin');
        } else {
          setError('No queries found for this TikTok handle. Submit a query via the Contact page first.');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const pinHash = await hashPin(pin);

      const { data: customerData } = await supabase
        .from('customers')
        .select('id, pin_hash, display_name')
        .eq('id', customerId)
        .single();

      if (!customerData || customerData.pin_hash !== pinHash) {
        setError('Incorrect PIN. Please try again.');
        setLoading(false);
        return;
      }

      if (customerData.display_name) setCustomerName(customerData.display_name);

      const rawHandle = handle.trim().replace(/^@/, '');
      const { data: ticketData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('tiktok_handle', rawHandle)
        .order('created_at', { ascending: false });

      setTickets(ticketData ?? []);
      setStep('tickets');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const pinHash = await hashPin(newPin);
      const rawHandle = handle.trim().replace(/^@/, '');

      if (customerId) {
        await supabase
          .from('customers')
          .update({ pin_hash: pinHash, pin_enrolled: true })
          .eq('id', customerId);
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({ tiktok_handle: rawHandle, pin_hash: pinHash, pin_enrolled: true })
          .select('id')
          .single();
        if (newCustomer) setCustomerId(newCustomer.id);
      }

      const { data: ticketData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('tiktok_handle', rawHandle)
        .order('created_at', { ascending: false });

      setTickets(ticketData ?? []);
      setStep('tickets');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setStep('handle');
    setHandle('');
    setPin('');
    setNewPin('');
    setConfirmPin('');
    setCustomerId('');
    setCustomerName('');
    setTickets([]);
    setError('');
  };

  // ── Step: Handle ──────────────────────────────────────
  if (step === 'handle') {
    return (
      <AuthCard>
        <form onSubmit={handleCheckHandle} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
              Step 1 of 2
            </p>
            <h3 className="font-display text-base font-bold mt-1" style={{ color: 'var(--foreground)' }}>
              Enter Your TikTok Handle
            </h3>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              TikTok Handle
            </label>
            <input
              ref={handleInputRef}
              type="text"
              required
              value={handle}
              onChange={e => { setHandle(e.target.value); setError(''); }}
              className="input-field text-sm"
              placeholder="@yourtiktok"
              autoComplete="off"
              suppressHydrationWarning
            />
          </div>
          {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Checking...' : 'Continue →'}
          </button>
        </form>
      </AuthCard>
    );
  }

  // ── Step: Enter PIN ───────────────────────────────────
  if (step === 'enter-pin') {
    return (
      <AuthCard>
        <form onSubmit={handleVerifyPin} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
              Step 2 of 2
            </p>
            <h3 className="font-display text-base font-bold mt-1" style={{ color: 'var(--foreground)' }}>
              Enter Your PIN
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
              @{handle.replace(/^@/, '')}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              4-Digit PIN
            </label>
            <input
              ref={pinInputRef}
              type="password"
              required
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              className="input-field text-sm text-center tracking-widest"
              placeholder="••••"
              autoComplete="off"
              suppressHydrationWarning
            />
          </div>
          {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Verifying...' : 'View My Queries ✦'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('handle'); setPin(''); setError(''); }}
            className="w-full text-xs text-center"
            style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back
          </button>
        </form>
      </AuthCard>
    );
  }

  // ── Step: Create PIN ──────────────────────────────────
  if (step === 'create-pin') {
    return (
      <AuthCard>
        <form onSubmit={handleCreatePin} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
              First Time Setup
            </p>
            <h3 className="font-display text-base font-bold mt-1" style={{ color: 'var(--foreground)' }}>
              Create Your PIN
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
              Set a 4-digit PIN to access your queries
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Create 4-Digit PIN
            </label>
            <input
              ref={newPinInputRef}
              type="password"
              required
              maxLength={4}
              value={newPin}
              onChange={e => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              className="input-field text-sm text-center tracking-widest"
              placeholder="••••"
              autoComplete="new-password"
              suppressHydrationWarning
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Confirm PIN
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={confirmPin}
              onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              className="input-field text-sm text-center tracking-widest"
              placeholder="••••"
              autoComplete="new-password"
              suppressHydrationWarning
            />
          </div>
          {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Saving...' : 'Create PIN & View Queries ✦'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('handle'); setNewPin(''); setConfirmPin(''); setError(''); }}
            className="w-full text-xs text-center"
            style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back
          </button>
        </form>
      </AuthCard>
    );
  }

  // ── Step: Tickets view ────────────────────────────────
  const rawHandle = handle.trim().replace(/^@/, '');

  return (
    <div className="content-wrapper py-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 transition-opacity hover:opacity-70"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            <Icon name="ArrowLeftIcon" size={13} />
            Back to Home
          </Link>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
            ✦ Customer Portal ✦
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
            My Queries
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
            @{rawHandle} · {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
        >
          <Icon name="ArrowRightOnRectangleIcon" size={14} />
          Sign Out
        </button>
      </div>

      {/* Tickets */}
      {tickets.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(139,92,246,0.1)' }}
          >
            <Icon name="ChatBubbleLeftRightIcon" size={24} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
          </div>
          <h3 className="font-display text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            No queries yet
          </h3>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            You haven&apos;t submitted any support tickets. Visit the Contact page to send us a message.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {tickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              customerHandle={rawHandle}
              customerName={customerName || ticket.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
