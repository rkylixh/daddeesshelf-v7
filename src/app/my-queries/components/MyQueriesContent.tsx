'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

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

type AuthStep = 'handle' | 'enter-pin' | 'create-pin' | 'tickets';

// ── Status config ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'New': '#f59e0b',
  'In Progress': '#3b82f6',
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

// ── Ticket Card ────────────────────────────────────────────
function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[ticket.status] ?? '#f59e0b';
  const hasResponse = ticket.admin_notes && ticket.admin_notes.trim().length > 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

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
            {hasResponse && (
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                ✦ Response Available
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

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-4 space-y-4">
            {/* Original message */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-subtle)' }}>
                Your Message
              </p>
              <div
                className="rounded-lg p-3 text-sm"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: 'var(--foreground-muted)', lineHeight: '1.6' }}
              >
                {ticket.message}
              </div>
            </div>

            {/* Admin response */}
            {hasResponse ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#10b981' }}>
                  ✦ Admin Response
                </p>
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--foreground-muted)', lineHeight: '1.6' }}
                >
                  {ticket.admin_notes}
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                  Last updated {formatDate(ticket.updated_at)}
                </p>
              </div>
            ) : (
              <div
                className="rounded-lg p-3 text-sm text-center"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground-subtle)' }}
              >
                No response yet — we&apos;ll get back to you soon via TikTok or here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function MyQueriesContent() {
  const [step, setStep] = useState<AuthStep>('handle');
  const [handle, setHandle] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const newPinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'handle') handleInputRef.current?.focus();
    else if (step === 'enter-pin') pinInputRef.current?.focus();
    else if (step === 'create-pin') newPinInputRef.current?.focus();
  }, [step]);

  // Step 1: Check TikTok handle
  const handleCheckHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) { setError('TikTok Handle is required.'); return; }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const rawHandle = handle.trim().replace(/^@/, '');

      const { data: customer } = await supabase
        .from('customers')
        .select('id, tiktok_handle, pin_hash, pin_enrolled')
        .eq('tiktok_handle', rawHandle)
        .maybeSingle();

      if (customer) {
        setCustomerId(customer.id);
        if (!customer.pin_enrolled || !customer.pin_hash) {
          setStep('create-pin');
        } else {
          setStep('enter-pin');
        }
      } else {
        // Check if they have any support tickets with this handle
        const { data: ticketCheck } = await supabase
          .from('support_tickets')
          .select('id')
          .eq('tiktok_handle', rawHandle)
          .limit(1);

        if (ticketCheck && ticketCheck.length > 0) {
          // Has tickets but no customer record — create one and set PIN
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

  // Step 2a: Verify PIN and load tickets
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

      const { data: customer } = await supabase
        .from('customers')
        .select('id, pin_hash')
        .eq('id', customerId)
        .single();

      if (!customer || customer.pin_hash !== pinHash) {
        setError('Incorrect PIN. Please try again.');
        setLoading(false);
        return;
      }

      // Load tickets
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

  // Step 2b: Create PIN (first time)
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
        // Update existing customer
        await supabase
          .from('customers')
          .update({ pin_hash: pinHash, pin_enrolled: true })
          .eq('id', customerId);
      } else {
        // Create new customer record
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({ tiktok_handle: rawHandle, pin_hash: pinHash, pin_enrolled: true })
          .select('id')
          .single();
        if (newCustomer) setCustomerId(newCustomer.id);
      }

      // Load tickets
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
    setTickets([]);
    setError('');
  };

  // ── Auth card wrapper ──────────────────────────────────
  const AuthCard = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
            ✦ Customer Portal ✦
          </p>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--foreground)' }}>My Queries</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--foreground-muted)' }}>
            View your support tickets and admin responses
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
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
