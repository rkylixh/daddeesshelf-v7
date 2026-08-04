'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import StarField from '@/components/layout/StarField';
import { createClient } from '@/lib/supabase/client';

const ADMIN_ACCESS_CODE = 'DADSHELF';

export default function AdminLoginContent() {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'auth'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const codeInputRef = useRef<HTMLInputElement>(null);
  const tiktokInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'code') {
      codeInputRef.current?.focus();
    } else {
      tiktokInputRef.current?.focus();
    }
  }, [step]);

  const handleCodeVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim().toUpperCase() !== ADMIN_ACCESS_CODE) {
      setError('Invalid access code. Please try again.');
      return;
    }
    setError('');
    setStep('auth');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.length !== 6 || !/^\d{6}$/.test(adminPin)) {
      setError('Admin PIN must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      // Verify admin credentials against admin_users table
      const handle = tiktokHandle.trim().replace(/^@/, '');
      const { data: adminUser, error: dbError } = await supabase
        .from('admin_users')
        .select('id, tiktok_handle, pin_hash, role, is_active')
        .eq('tiktok_handle', handle)
        .single();

      if (dbError || !adminUser) {
        throw new Error('Admin account not found. Please check your TikTok handle.');
      }
      if (!adminUser.is_active) {
        throw new Error('This admin account has been deactivated.');
      }

      // Hash the entered PIN for comparison
      const encoder = new TextEncoder();
      const data = encoder.encode(adminPin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (pinHash !== adminUser.pin_hash) {
        throw new Error('Incorrect PIN. Please try again.');
      }

      // Store admin session in sessionStorage
      sessionStorage.setItem('admin_session', JSON.stringify({
        id: adminUser.id,
        tiktok_handle: adminUser.tiktok_handle,
        role: adminUser.role,
        authenticated_at: Date.now(),
      }));

      router.push('/admin/inventory');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--background)' }}>
      <StarField />
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size={56} />
          </div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--primary-bright)' }}>
            Daddee&apos;s Shelf
          </h1>
          <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
            Admin Portal
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(139,92,246,0.15)' }}
        >
          {step === 'code' ? (
            <>
              <h2 className="font-display text-lg font-bold mb-1 text-center" style={{ color: 'var(--foreground)' }}>
                Enter Access Code
              </h2>
              <p className="text-xs text-center mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                Enter the admin access code to continue
              </p>
              <form onSubmit={handleCodeVerify} className="space-y-4">
                <div>
                  <input
                    ref={codeInputRef}
                    type="password"
                    required
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    className="input-field text-center tracking-widest text-lg"
                    placeholder="••••••••"
                  />
                </div>
                {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
                <button type="submit" className="btn-primary w-full py-3">
                  Verify Code
                </button>
                <a href="/" className="block text-center text-xs mt-3" style={{ color: 'var(--foreground-subtle)' }}>
                  ← Back to Site
                </a>
              </form>
              <p className="text-xs text-center mt-4" style={{ color: 'var(--foreground-subtle)' }}>
                Admin profile PINs are strictly separate from customer order-history PINs.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg font-bold mb-1 text-center" style={{ color: 'var(--foreground)' }}>
                Admin Sign In
              </h2>
              <p className="text-xs text-center mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                Enter your TikTok handle and 6-digit admin PIN
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    TikTok Handle
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                      style={{ color: 'var(--foreground-subtle)' }}
                    >
                      @
                    </span>
                    <input
                      ref={tiktokInputRef}
                      type="text"
                      required
                      value={tiktokHandle}
                      onChange={e => setTiktokHandle(e.target.value)}
                      className="input-field pl-7"
                      placeholder="your.tiktok.handle"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    6-Digit Admin PIN
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    inputMode="numeric"
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center tracking-widest text-lg"
                    placeholder="••••••"
                    autoComplete="current-password"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                    Enter your personal 6-digit administrator PIN
                  </p>
                </div>
                {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Verifying...' : 'Sign In to Admin ✦'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('code'); setError(''); }}
                  className="block w-full text-center text-xs mt-2"
                  style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
