'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
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

  const handleCodeVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim().toUpperCase() !== ADMIN_ACCESS_CODE) {
      setError('Invalid access code. Please try again.');
      return;
    }
    setError('');
    setStep('auth');
  };

  // Step 2: Check TikTok handle — determine if PIN exists or needs enrollment
  const handleCheckHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const rawHandle = tiktokHandle.trim();
      // Strip leading @ for lookup; also try with @ prefix for legacy records
      const handleNoAt = rawHandle.replace(/^@/, '');
      const handleWithAt = '@' + handleNoAt;

      // Try without @ first, then with @
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
        throw new Error('Admin account not found.');
      }
      if (!adminUser.is_active) {
        throw new Error('This admin account has been deactivated.');
      }

      setPendingAdminId(adminUser.id);

      // First login: PIN not yet set — prompt admin to create their PIN
      // Trim pin_hash to catch whitespace-only strings; coerce pin_set to boolean
      const pinHashValue = (adminUser.pin_hash ?? '').trim();
      const pinIsSet = adminUser.pin_set === true;

      if (!pinIsSet || !pinHashValue) {
        setStep('set-pin');
        return;
      }

      // PIN already set — show PIN entry form
      setStep('enter-pin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3a: Authenticate with existing PIN
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
        throw new Error('Incorrect PIN.');
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

  // Step 3b: First-time PIN creation
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

      // Log PIN creation in audit log
      await supabase.from('audit_logs').insert({
        admin_handle: tiktokHandle.trim().replace(/^@/, ''),
        action: 'PIN_CREATED',
        module: 'Admin Auth',
        explanation: 'Administrator created their initial login PIN.',
      }).then(() => {}).catch(() => {});

      // Auto-login after PIN creation
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
          {/* Step 1: Access Code */}
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
          )}

          {/* Step 2: TikTok Handle lookup */}
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

          {/* Step 3a: Enter existing PIN */}
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

          {/* Step 3b: First-login PIN creation */}
          {step === 'set-pin' && (
            <>
              <h2 className="font-display text-lg font-bold mb-1 text-center" style={{ color: 'var(--foreground)' }}>
                Create Your Admin PIN
              </h2>
              <p className="text-xs text-center mb-2" style={{ color: 'var(--foreground-subtle)' }}>
                Welcome! This is your first login.
              </p>
              <p className="text-xs text-center mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                Please create a unique 6-digit PIN. You will use this PIN for all future logins and to confirm privileged actions.
              </p>
              <form onSubmit={handleSetPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    New 6-Digit PIN
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    Confirm PIN
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
