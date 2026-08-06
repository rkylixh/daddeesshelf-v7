'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import StarField from '@/components/layout/StarField';
import { createClient } from '@/lib/supabase/client';

const ADMIN_ACCESS_CODE = 'DADSHELF';

type LoginStep = 'code' | 'auth' | 'enter-pin' | 'set-pin';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminLoginContent() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('code');
  const [accessCode, setAccessCode] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pendingAdminId, setPendingAdminId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const codeInputRef = useRef<HTMLInputElement>(null);
  const tiktokInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const newPinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
    else if (step === 'auth') tiktokInputRef.current?.focus();
    else if (step === 'enter-pin') pinInputRef.current?.focus();
    else if (step === 'set-pin') newPinInputRef.current?.focus();
  }, [step]);

  // Step 1: Verify access code
  const handleCodeVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim().toUpperCase() !== ADMIN_ACCESS_CODE) {
      setError('Invalid access code. Please try again.');
      return;
    }
    setError('');
    setStep('auth');
  };

  // Step 2: Validate TikTok handle against admin_users — no PIN asked yet
  const handleCheckHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const rawHandle = tiktokHandle.trim();
      const handleNoAt = rawHandle.replace(/^@/, '');
      const handleWithAt = '@' + handleNoAt;

      let adminUser = null;

      const { data: d1 } = await supabase
        .from('admin_users')
        .select('id, tiktok_handle, pin_hash, pin_set, role, is_active')
        .eq('tiktok_handle', handleNoAt)
        .maybeSingle();

      if (d1) {
        adminUser = d1;
      } else {
        const { data: d2 } = await supabase
          .from('admin_users')
          .select('id, tiktok_handle, pin_hash, pin_set, role, is_active')
          .eq('tiktok_handle', handleWithAt)
          .maybeSingle();
        if (d2) adminUser = d2;
      }

      if (!adminUser) {
        setError('Administrator account not found. Please verify your TikTok handle.');
        setLoading(false);
        return;
      }

      if (!adminUser.is_active) {
        setError('This admin account has been deactivated.');
        setLoading(false);
        return;
      }

      setPendingAdminId(adminUser.id);

      const pinHashValue = (adminUser.pin_hash ?? '').trim();
      const pinIsSet = adminUser.pin_set === true;

      if (!pinIsSet || !pinHashValue) {
        // First-time administrator — go to Create PIN screen
        setStep('set-pin');
      } else {
        // Returning administrator — go to Enter PIN screen
        setStep('enter-pin');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3a: Returning admin — verify existing PIN
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

      const { data: adminUser, error: dbError } = await supabase
        .from('admin_users')
        .select('id, tiktok_handle, pin_hash, pin_set, role, is_active')
        .eq('id', pendingAdminId)
        .single();

      if (dbError || !adminUser) {
        throw new Error('Admin account not found.');
      }

      const pinHash = await hashPin(adminPin);

      if (pinHash !== adminUser.pin_hash) {
        throw new Error('Incorrect PIN. Please try again.');
      }

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

  // Step 3b: First-time admin — create and save PIN
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setError('PIN must be exactly 6 digits.');
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

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ pin_hash: pinHash, pin_set: true })
        .eq('id', pendingAdminId);

      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert({
        admin_handle: tiktokHandle.trim().replace(/^@/, ''),
        action: 'PIN_CREATED',
        module: 'Admin Auth',
        explanation: 'Administrator created their initial login PIN.',
      }).then(() => {}).catch(() => {});

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, tiktok_handle, role')
        .eq('id', pendingAdminId)
        .single();

      if (adminUser) {
        sessionStorage.setItem('admin_session', JSON.stringify({
          id: adminUser.id,
          tiktok_handle: adminUser.tiktok_handle,
          role: adminUser.role,
          authenticated_at: Date.now(),
        }));
        router.push('/admin/inventory');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'linear-gradient(180deg, #2C1A0E 0%, #1E1008 100%)' }}>
      <StarField />
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/images/image-1785915949797.png"
              alt="Daddee's Shelf logo"
              width={72}
              height={72}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--primary)' }}>
            Daddee&apos;s Shelf
          </h1>
          <p className="text-xs mt-1 uppercase tracking-widest font-sans" style={{ color: 'rgba(200,164,91,0.5)' }}>
            Admin Portal
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: '#3A2214', border: '1px solid rgba(200,164,91,0.3)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
        >
          {/* Step 1: Admin Access Code */}
          {step === 'code' && (
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
                    suppressHydrationWarning
                  />
                </div>
                {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
                <button type="submit" className="btn-primary w-full py-3" suppressHydrationWarning>
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
          )}

          {/* Step 2: TikTok Handle only — no PIN field */}
          {step === 'auth' && (
            <>
              <h2 className="font-display text-lg font-bold mb-1 text-center" style={{ color: 'var(--foreground)' }}>
                Admin Sign In
              </h2>
              <p className="text-xs text-center mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                Enter your TikTok handle to continue
              </p>
              <form onSubmit={handleCheckHandle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    TikTok Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--foreground-subtle)' }}>@</span>
                    <input
                      ref={tiktokInputRef}
                      type="text"
                      required
                      value={tiktokHandle}
                      onChange={e => setTiktokHandle(e.target.value)}
                      className="input-field pl-7"
                      placeholder="your.tiktok.handle"
                      autoComplete="username"
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Checking...' : 'Continue →'}
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

          {/* Step 3a: Returning admin — Enter existing PIN */}
          {step === 'enter-pin' && (
            <>
              <h2 className="font-display text-lg font-bold mb-1 text-center" style={{ color: 'var(--foreground)' }}>
                Enter Your PIN
              </h2>
              <p className="text-xs text-center mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                Welcome back, <strong style={{ color: 'var(--primary-bright)' }}>@{tiktokHandle.replace(/^@/, '')}</strong>
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    6-Digit Admin PIN
                  </label>
                  <input
                    ref={pinInputRef}
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
                    suppressHydrationWarning
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
                  onClick={() => { setStep('auth'); setPendingAdminId(''); setAdminPin(''); setError(''); }}
                  className="block w-full text-center text-xs mt-2"
                  style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Change Handle
                </button>
              </form>
            </>
          )}

          {/* Step 3b: First-time admin — Create PIN */}
          {step === 'set-pin' && (
            <>
              <h2 className="font-display text-lg font-bold mb-1 text-center" style={{ color: 'var(--foreground)' }}>
                Create Admin PIN
              </h2>
              <p className="text-xs text-center mb-2" style={{ color: 'var(--foreground-subtle)' }}>
                Welcome! This is your first login.
              </p>
              <p className="text-xs text-center mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                Please create a unique 6-digit PIN. You will use this PIN for all future logins.
              </p>
              <form onSubmit={handleSetPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    Create 6-Digit PIN
                  </label>
                  <input
                    ref={newPinInputRef}
                    type="password"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    inputMode="numeric"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center tracking-widest text-lg"
                    placeholder="••••••"
                    autoComplete="new-password"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    Confirm 6-Digit PIN
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center tracking-widest text-lg"
                    placeholder="••••••"
                    autoComplete="new-password"
                    suppressHydrationWarning
                  />
                </div>
                {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
                <div
                  className="rounded-lg p-3 text-xs"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--foreground-subtle)' }}
                >
                  ✦ Your PIN is hashed and stored securely. Daddee&apos;s Shelf staff cannot view your PIN.
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Saving...' : 'Set PIN & Sign In ✦'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('auth'); setPendingAdminId(''); setNewPin(''); setConfirmPin(''); setError(''); }}
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
