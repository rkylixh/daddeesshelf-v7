'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import StarField from '@/components/layout/StarField';
import { createClient } from '@/lib/supabase/client';
import { ADMIN_ACCESS_CODE, saveAdminSession } from '@/lib/admin-auth';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminLoginContent() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate access code
    if (accessCode.trim().toUpperCase() !== ADMIN_ACCESS_CODE) {
      setError('Invalid access code. Please try again.');
      return;
    }

    if (!tiktokHandle.trim()) {
      setError('Please enter your TikTok handle.');
      return;
    }

    if (adminPin.length !== 6 || !/^\d{6}$/.test(adminPin)) {
      setError('Admin PIN must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const rawHandle = tiktokHandle.trim();
      const handleNoAt = rawHandle.replace(/^@/, '');
      const handleWithAt = '@' + handleNoAt;

      let adminUser = null;

      const { data: d1 } = await supabase
        .from('admin_users')
        .select('id, tiktok_handle, pin_hash, pin_set, role, is_active, display_name')
        .eq('tiktok_handle', handleNoAt)
        .maybeSingle();

      if (d1) {
        adminUser = d1;
      } else {
        const { data: d2 } = await supabase
          .from('admin_users')
          .select('id, tiktok_handle, pin_hash, pin_set, role, is_active, display_name')
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

      const pinHashValue = (adminUser.pin_hash ?? '').trim();
      const pinIsSet = adminUser.pin_set === true;

      if (!pinIsSet || !pinHashValue) {
        // First-time admin — set their PIN now
        const pinHash = await hashPin(adminPin);
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ pin_hash: pinHash, pin_set: true })
          .eq('id', adminUser.id);
        if (updateError) throw updateError;

        await supabase.from('audit_logs').insert({
          admin_handle: handleNoAt,
          action: 'PIN_CREATED',
          module: 'Admin Auth',
          explanation: 'Administrator created their initial login PIN.',
        }).then(() => {}).catch(() => {});

        saveAdminSession(adminUser);
        router.push('/admin/inventory');
      } else {
        // Returning admin — verify PIN
        const pinHash = await hashPin(adminPin);
        if (pinHash !== adminUser.pin_hash) {
          setError('Incorrect PIN. Please try again.');
          setLoading(false);
          return;
        }
        saveAdminSession(adminUser);
        router.push('/admin/inventory');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
          <h2 className="font-display text-lg font-bold mb-1 text-center" style={{ color: 'var(--foreground)' }}>
            Admin Sign In
          </h2>
          <p className="text-xs text-center mb-6" style={{ color: 'var(--foreground-subtle)' }}>
            Enter your credentials to access the admin portal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Access Code */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                Access Code
              </label>
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

            {/* TikTok Handle */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                TikTok Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--foreground-subtle)' }}>@</span>
                <input
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

            {/* PIN */}
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
                suppressHydrationWarning
              />
              <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                First-time login? Your PIN will be set on first sign-in.
              </p>
            </div>

            {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
              style={{ opacity: loading ? 0.7 : 1 }}
              suppressHydrationWarning
            >
              {loading ? 'Signing In...' : 'Sign In to Admin ✦'}
            </button>

            <a href="/" className="block text-center text-xs mt-3" style={{ color: 'var(--foreground-subtle)' }}>
              ← Back to Site
            </a>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: 'var(--foreground-subtle)' }}>
            Admin profile PINs are strictly separate from customer order-history PINs.
          </p>
        </div>
      </div>
    </div>
  );
}
