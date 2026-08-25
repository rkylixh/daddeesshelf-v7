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

// ── Customer ID Overlay (reused pattern from signup) ──────
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
          <h2 className="font-display text-xl font-bold" style={{ color: '#F0DFC4' }}>Account Claimed, {username}!</h2>
          <p className="text-xs mt-1" style={{ color: '#C8A45B' }}>Your Customer ID has been generated</p>
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

// ── Step types ─────────────────────────────────────────────
type IdentifyMethod = 'tiktok' | 'customer_id';
type Step = 'identify' | 'setup';

interface FoundCustomer {
  id: string;
  customer_id: string | null;
  tiktok_handle: string | null;
  username: string | null;
  pin_enrolled: boolean | null;
}

// ── Main Component ─────────────────────────────────────────
export default function ClaimAccountContent() {
  const router = useRouter();
  const { login } = useCustomerAuth();

  const [step, setStep] = useState<Step>('identify');
  const [method, setMethod] = useState<IdentifyMethod>('tiktok');

  // Identify step
  const [tiktokInput, setTiktokInput] = useState('');
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const [identifyError, setIdentifyError] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<FoundCustomer | null>(null);

  // Setup step
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  // Overlay
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<CustomerSession | null>(null);

  // ── Step 1: Identify ──────────────────────────────────────
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifyError('');

    const supabase = createClient();

    if (method === 'tiktok') {
      const handle = tiktokInput.trim().replace(/^@/, '');
      if (!handle) { setIdentifyError('Please enter your TikTok handle.'); return; }

      setIdentifyLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, customer_id, tiktok_handle, username, pin_enrolled')
          .eq('tiktok_handle', '@' + handle)
          .maybeSingle();

        if (error || !data) {
          setIdentifyError('No customer found with that TikTok handle. Please check the spelling or contact support.');
          return;
        }

        if (data.username && data.pin_enrolled) {
          setIdentifyError('This TikTok handle is already linked to a Shelfie account. Please use your Shelfie Username to log in instead.');
          return;
        }

        setFoundCustomer(data);
        setStep('setup');
      } catch {
        setIdentifyError('Something went wrong. Please try again.');
      } finally {
        setIdentifyLoading(false);
      }
    } else {
      const code = customerIdInput.trim().toUpperCase();
      if (!code) { setIdentifyError('Please enter your Customer ID.'); return; }

      setIdentifyLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, customer_id, tiktok_handle, username, pin_enrolled')
          .eq('customer_id', code)
          .maybeSingle();

        if (error || !data) {
          setIdentifyError('No customer found with that Customer ID. Please check the ID or use your TikTok handle instead.');
          return;
        }

        if (data.username && data.pin_enrolled) {
          setIdentifyError('This account already has a username and PIN set up. Please log in instead.');
          return;
        }

        setFoundCustomer(data);
        setStep('setup');
      } catch {
        setIdentifyError('Something went wrong. Please try again.');
      } finally {
        setIdentifyLoading(false);
      }
    }
  };

  // ── Step 2: Setup ─────────────────────────────────────────
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) { setSetupError('Username is required.'); return; }
    if (trimmedUsername.length < 3) { setSetupError('Username must be at least 3 characters.'); return; }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setSetupError('PIN must be exactly 4 digits.'); return; }
    if (pin !== confirmPin) { setSetupError('PINs do not match.'); return; }
    if (!foundCustomer) return;

    setSetupLoading(true);
    try {
      const supabase = createClient();

      // Check username availability
      const { data: existingUsername } = await supabase
        .from('customers')
        .select('id')
        .eq('username', trimmedUsername)
        .maybeSingle();

      if (existingUsername) {
        setSetupError('This username is already taken. Please choose another.');
        setSetupLoading(false);
        return;
      }

      const pinHash = await hashCustomerPin(pin);

      // Generate Customer ID if they don't have one
      let customerCode = foundCustomer.customer_id;
      let generatedNew = false;
      if (!customerCode) {
        generatedNew = true;
        customerCode = generateCustomerCode();
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
      }

      // Update the existing customer record
      const { data: updated, error: updateErr } = await supabase
        .from('customers')
        .update({
          username: trimmedUsername,
          pin_hash: pinHash,
          pin_enrolled: true,
          customer_id: customerCode,
        })
        .eq('id', foundCustomer.id)
        .select('id, customer_id, username, tiktok_handle')
        .single();

      if (updateErr || !updated) {
        throw new Error(updateErr?.message || 'Failed to set up account. Please try again.');
      }

      const session: CustomerSession = {
        customerId: updated.id,
        customerCode: updated.customer_id,
        username: updated.username,
        tiktokHandle: updated.tiktok_handle ?? '',
        authenticatedAt: Date.now(),
      };

      if (generatedNew) {
        // Show overlay with new Customer ID before logging in
        setPendingSession(session);
        setNewCustomerId(customerCode);
      } else {
        // Already had a Customer ID — log in directly
        login(session);
        router.push('/orders');
      }
    } catch (err: unknown) {
      setSetupError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleOverlayDismiss = () => {
    if (pendingSession) {
      login(pendingSession);
      router.push('/orders');
    }
  };

  return (
    <>
      {newCustomerId && pendingSession && (
        <CustomerIdOverlay
          customerId={newCustomerId}
          username={pendingSession.username}
          onDismiss={handleOverlayDismiss}
        />
      )}

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
                ✦ Existing Customer ✦
              </p>
              <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Claim Your Account
              </h1>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
                {step === 'identify' ?'Already ordered before? Identify yourself to set up your login credentials and access your order history.'
                  : `Found you! Now create a username and PIN to log in going forward.`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {(['identify', 'setup'] as Step[]).map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: step === s ? 'var(--primary)' : (i < (['identify', 'setup'] as Step[]).indexOf(step) ? 'rgba(200,164,91,0.3)' : 'var(--background-card)'),
                        color: step === s ? '#1a0a00' : 'var(--foreground-muted)',
                        border: `1px solid ${step === s ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs font-medium" style={{ color: step === s ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                      {s === 'identify' ? 'Identify' : 'Set Up Login'}
                    </span>
                  </div>
                  {i < 1 && <div className="w-8 h-px" style={{ background: 'var(--border)' }} />}
                </React.Fragment>
              ))}
            </div>

            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              {/* ── STEP 1: IDENTIFY ── */}
              {step === 'identify' && (
                <form onSubmit={handleIdentify} className="space-y-5">
                  {/* Method toggle */}
                  <div>
                    <p className="text-xs font-semibold mb-3" style={{ color: 'var(--foreground-muted)' }}>
                      How would you like to identify yourself?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setMethod('tiktok'); setIdentifyError(''); }}
                        className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: method === 'tiktok' ? 'rgba(200,164,91,0.15)' : 'var(--background)',
                          color: method === 'tiktok' ? 'var(--primary)' : 'var(--foreground-muted)',
                          border: `1.5px solid ${method === 'tiktok' ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                      >
                        🎵 TikTok Handle
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMethod('customer_id'); setIdentifyError(''); }}
                        className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: method === 'customer_id' ? 'rgba(200,164,91,0.15)' : 'var(--background)',
                          color: method === 'customer_id' ? 'var(--primary)' : 'var(--foreground-muted)',
                          border: `1.5px solid ${method === 'customer_id' ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                      >
                        🪪 Customer ID
                      </button>
                    </div>
                  </div>

                  {/* Input based on method */}
                  {method === 'tiktok' ? (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                        TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
                      </label>
                      <div className="relative">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          @
                        </span>
                        <input
                          type="text"
                          required
                          value={tiktokInput}
                          onChange={e => setTiktokInput(e.target.value)}
                          className="input-field text-sm pl-7"
                          placeholder="yourtiktokhandle"
                          autoFocus
                        />
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                        The TikTok handle you used when placing orders
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                        Customer ID <span style={{ color: 'var(--primary)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerIdInput}
                        onChange={e => setCustomerIdInput(e.target.value.toUpperCase())}
                        className="input-field text-sm tracking-widest"
                        placeholder="DS-XXXXXXXX"
                        autoFocus
                      />
                      <p className="text-xs mt-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                        The Customer ID from a previous order confirmation
                      </p>
                    </div>
                  )}

                  {identifyError && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <p className="text-xs" style={{ color: '#f87171' }}>{identifyError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={identifyLoading}
                    className="btn-primary w-full py-3 text-sm"
                    style={{ opacity: identifyLoading ? 0.7 : 1 }}
                  >
                    {identifyLoading ? 'Looking up...' : 'Find My Account ✦'}
                  </button>
                </form>
              )}

              {/* ── STEP 2: SETUP ── */}
              {step === 'setup' && foundCustomer && (
                <form onSubmit={handleSetup} className="space-y-4">
                  {/* Found customer info */}
                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(200,164,91,0.08)', border: '1px solid rgba(200,164,91,0.3)' }}
                  >
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--primary)' }}>✓ Account Found</p>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {foundCustomer.tiktok_handle && (
                        <span>TikTok: <strong style={{ color: 'var(--foreground)' }}>{foundCustomer.tiktok_handle}</strong></span>
                      )}
                      {foundCustomer.customer_id && (
                        <span className={foundCustomer.tiktok_handle ? ' · ' : ''}>
                          ID: <strong style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>{foundCustomer.customer_id}</strong>
                        </span>
                      )}
                      {!foundCustomer.customer_id && (
                        <span className={foundCustomer.tiktok_handle ? ' · ' : ''}>
                          A Customer ID will be generated for you
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                      Choose a Username <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Your display name"
                      autoFocus
                    />
                  </div>

                  {/* PIN */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                      Create a 4-Digit PIN <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="input-field text-sm text-center tracking-widest"
                      placeholder="••••"
                      inputMode="numeric"
                    />
                  </div>

                  {setupError && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <p className="text-xs" style={{ color: '#f87171' }}>{setupError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setStep('identify'); setSetupError(''); setFoundCustomer(null); }}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--background)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={setupLoading}
                      className="btn-primary flex-1 py-3 text-sm"
                      style={{ opacity: setupLoading ? 0.7 : 1 }}
                    >
                      {setupLoading ? 'Setting up...' : 'Claim Account ✦'}
                    </button>
                  </div>
                </form>
              )}

              {/* Footer links */}
              <div className="mt-5 pt-4 space-y-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  Already set up?{' '}
                  <Link href="/login" className="font-semibold" style={{ color: 'var(--primary-bright)' }}>
                    Log in
                  </Link>
                </p>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  New customer?{' '}
                  <Link href="/signup" className="font-semibold" style={{ color: 'var(--primary-bright)' }}>
                    Sign up
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
