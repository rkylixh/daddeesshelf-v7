'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { hashCustomerPin, CustomerSession } from '@/lib/customer-auth';
import AppLogo from '@/components/ui/AppLogo';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function LoginContent() {
  const router = useRouter();
  const { login } = useCustomerAuth();

  const [form, setForm] = useState({ username: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const username = form.username.trim();
    const pin = form.pin;

    if (!username) { setError('Username is required.'); return; }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();

      // Look up by username
      const { data: customer, error: fetchErr } = await supabase
        .from('customers')
        .select('id, customer_id, username, tiktok_handle, pin_hash, pin_enrolled')
        .eq('username', username)
        .maybeSingle();

      if (fetchErr || !customer) {
        setError('Username not found. Please check your username or sign up.');
        setLoading(false);
        return;
      }

      if (!customer.pin_enrolled || !customer.pin_hash) {
        setError('Account setup incomplete. Please contact support.');
        setLoading(false);
        return;
      }

      const pinHash = await hashCustomerPin(pin);
      if (pinHash !== customer.pin_hash) {
        setError('Incorrect PIN. Please try again.');
        setLoading(false);
        return;
      }

      const session: CustomerSession = {
        customerId: customer.id,
        customerCode: customer.customer_id,
        username: customer.username,
        tiktokHandle: customer.tiktok_handle,
        authenticatedAt: Date.now(),
      };

      login(session);
      router.push('/orders');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
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
                ✦ Welcome Back ✦
              </p>
              <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Log In
              </h1>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
                Enter your username and PIN to access your orders and notifications.
              </p>
            </div>

            {/* Form */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Your username"
                    autoFocus
                  />
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
                  {loading ? 'Logging in...' : 'Log In ✦'}
                </button>
              </form>

              <div className="mt-5 pt-4 space-y-3 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="font-semibold" style={{ color: 'var(--primary-bright)' }}>
                    Sign up
                  </Link>
                </p>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  Ordered before but no login yet?{' '}
                  <Link href="/claim-account" className="font-semibold" style={{ color: 'var(--primary-bright)' }}>
                    Claim existing account
                  </Link>
                </p>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  Have orders but no account?{' '}
                  <Link href="/orders" className="font-semibold" style={{ color: 'var(--primary-bright)' }}>
                    Track via TikTok handle
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
