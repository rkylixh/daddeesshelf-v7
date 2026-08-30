'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { hashCustomerPin, generateCustomerCode, CustomerSession } from '@/lib/customer-auth';
import AppLogo from '@/components/ui/AppLogo';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ── Customer ID Overlay ────────────────────────────────────
interface CustomerIdOverlayProps {
  customerId: string;
  username: string;
  onDismiss: () => void;
}

function CustomerIdOverlay({ customerId, username, onDismiss }: CustomerIdOverlayProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(customerId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,6,2,0.98)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#1a0e06', border: '2px solid rgba(200,164,91,0.6)', boxShadow: '0 0 60px rgba(200,164,91,0.15)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(200,164,91,0.2), rgba(139,69,19,0.15))', borderBottom: '1px solid rgba(200,164,91,0.3)' }}
        >
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="font-display text-xl font-bold" style={{ color: '#F0DFC4' }}>Welcome, {username}!</h2>
          <p className="text-xs mt-1" style={{ color: '#C8A45B' }}>Your account has been created</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer ID display */}
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'rgba(139,92,246,0.12)', border: '2px solid rgba(139,92,246,0.5)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a78bfa' }}>
              Your Customer ID
            </p>
            <p
              className="font-display text-2xl font-bold mb-1"
              style={{ color: '#F0DFC4', letterSpacing: '0.12em', fontFamily: 'monospace' }}
            >
              {customerId}
            </p>
            <button
              onClick={handleCopy}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' }}
            >
              {copied ? '✓ Copied!' : 'Copy ID'}
            </button>
          </div>

          {/* Warning */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)' }}
          >
            <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#f87171' }}>
              <span>📸</span> Save This Now — You Cannot Recover It
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#F0DFC4' }}>
              <strong>Screenshot this screen</strong> or write down your Customer ID. This is your permanent identifier — it links all your orders and requests. There is no email recovery.
            </p>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
              style={{ accentColor: '#C8A45B' }}
            />
            <span className="text-sm" style={{ color: '#D4B896' }}>
              I have saved / screenshotted my Customer ID and understand I cannot recover it without it.
            </span>
          </label>

          <button
            onClick={onDismiss}
            disabled={!confirmed}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: confirmed ? 'rgba(200,164,91,0.85)' : 'rgba(200,164,91,0.2)',
              color: confirmed ? '#1a0a00' : '#8a7060',
              cursor: confirmed ? 'pointer' : 'not-allowed',
              border: `1px solid ${confirmed ? 'rgba(200,164,91,0.8)' : 'rgba(200,164,91,0.2)'}`,
            }}
          >
            I&apos;ve Saved My ID — Continue ✦
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Signup Component ──────────────────────────────────
export default function SignupContent() {
  const router = useRouter();
  const { login } = useCustomerAuth();

  const [form, setForm] = useState({
    tiktokHandle: '',
    username: '',
    pin: '',
    confirmPin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<CustomerSession | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const tiktok = form.tiktokHandle.trim().replace(/^@/, '');
    const username = form.username.trim();
    const pin = form.pin;
    const confirmPin = form.confirmPin;

    if (!tiktok) { setError('TikTok handle is required.'); return; }
    if (!username) { setError('Username is required.'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); return; }
    if (pin !== confirmPin) { setError('PINs do not match.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const normalizedHandle = '@' + tiktok.toLowerCase();

      // Check if TikTok handle already registered (case-insensitive, with or without @)
      const { data: existingHandle } = await supabase
        .from('customers')
        .select('id')
        .or(`tiktok_handle.eq.${normalizedHandle},tiktok_handle.eq.${tiktok.toLowerCase()}`)
        .maybeSingle();

      if (existingHandle) {
        setError('This TikTok handle is already registered. Please create a Shelfie Username to log in or sign up instead.');
        setLoading(false);
        return;
      }

      // Check if username taken
      const { data: existingUsername } = await supabase
        .from('customers')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUsername) {
        setError('This username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      // Generate unique customer code
      const pinHash = await hashCustomerPin(pin);
      let customerCode = generateCustomerCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('customer_id', customerCode)
          .maybeSingle();
        if (!existing) break;
        customerCode = generateCustomerCode();
        attempts++;
      }

      // Insert customer
      const { data: newCustomer, error: insertErr } = await supabase
        .from('customers')
        .insert({
          tiktok_handle: normalizedHandle,
          username,
          pin_hash: pinHash,
          pin_enrolled: true,
          customer_id: customerCode,
        })
        .select('id, customer_id, username, tiktok_handle')
        .single();

      if (insertErr || !newCustomer) {
        throw new Error(insertErr?.message || 'Failed to create account. Please try again.');
      }

      const session: CustomerSession = {
        customerId: newCustomer.id,
        customerCode: newCustomer.customer_id,
        username: newCustomer.username,
        tiktokHandle: newCustomer.tiktok_handle,
        authenticatedAt: Date.now(),
      };

      setNewSession(session);
      setNewCustomerId(customerCode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayDismiss = () => {
    if (newSession) {
      login(newSession);
      router.push('/orders');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="content-wrapper">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <AppLogo size={48} variant="full" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
                ✦ Create Account ✦
              </p>
              <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Join Daddee&apos;s Shelf
              </h1>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
                Sign up to track your orders, title requests, and get notified when your books are on hand.
              </p>
            </div>

            {/* Form */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* TikTok Handle */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.tiktokHandle}
                    onChange={e => setForm(f => ({ ...f, tiktokHandle: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="@yourtiktok"
                    autoFocus
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                    Must match the TikTok handle you use to place orders.
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    Username <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="e.g. bookworm_ph"
                    maxLength={30}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                    This is your display name on the platform.
                  </p>
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    4-Digit PIN <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={form.pin}
                    onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="input-field text-sm text-center tracking-widest"
                    placeholder="••••"
                    inputMode="numeric"
                  />
                </div>

                {/* Confirm PIN */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    Confirm PIN <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={form.confirmPin}
                    onChange={e => setForm(f => ({ ...f, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="input-field text-sm text-center tracking-widest"
                    placeholder="••••"
                    inputMode="numeric"
                  />
                </div>

                {error && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Creating Account...' : 'Create Account ✦'}
                </button>
              </form>

              <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold" style={{ color: 'var(--primary-bright)' }}>
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Customer ID overlay shown after successful signup */}
      {newCustomerId && (
        <CustomerIdOverlay
          customerId={newCustomerId}
          username={form.username.trim()}
          onDismiss={handleOverlayDismiss}
        />
      )}
    </>
  );
}
