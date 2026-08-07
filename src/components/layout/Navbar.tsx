'use client';

import React, { useState, useRef, useEffect, useCallback, useContext, createContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';

// ── Preorder Cart Context ──────────────────────────────────
export interface CartItem {
  book: Book;
  qty: number;
  soldOut?: boolean; // true if book became sold out after being added
}

interface CartContextValue {
  items: CartItem[];
  addItem: (book: Book) => void;
  removeItem: (bookId: string) => void;
  updateQty: (bookId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  refreshCartStock: () => Promise<void>;
}

export const CartContext = React.createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  total: 0,
  refreshCartStock: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((book: Book) => {
    setItems(prev => {
      const existing = prev.find(i => i.book.id === book.id);
      // Compute available stock: reserved=1 means sold out regardless
      const isReservedSoldOut = (book.reserved ?? 0) === 1;
      const available = isReservedSoldOut ? 0 : Math.max(0, (book.inventory ?? 0) - (book.reserved ?? 0));
      if (existing) {
        // Do not exceed available stock
        if (existing.qty >= available) return prev; // silently cap
        return prev.map(i => i.book.id === book.id ? { ...i, qty: i.qty + 1 } : i);
      }
      if (available <= 0) return prev; // cannot add sold-out item
      return [...prev, { book, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((bookId: string) => {
    setItems(prev => prev.filter(i => i.book.id !== bookId));
  }, []);

  const updateQty = useCallback((bookId: string, qty: number) => {
    if (qty <= 0) { removeItem(bookId); return; }
    setItems(prev => prev.map(i => {
      if (i.book.id !== bookId) return i;
      // Enforce stock cap
      const isReservedSoldOut = (i.book.reserved ?? 0) === 1;
      const available = isReservedSoldOut ? 0 : Math.max(0, (i.book.inventory ?? 0) - (i.book.reserved ?? 0));
      const cappedQty = Math.min(qty, available);
      if (cappedQty <= 0) return i; // don't allow 0 via updateQty (use removeItem)
      return { ...i, qty: cappedQty };
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  // Re-fetch book stock for all cart items and mark sold-out ones
  const refreshCartStock = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const ids = items.map(i => i.book.id);
      const { data } = await supabase
        .from('books')
        .select('id, inventory, reserved, visibility, arrival_date')
        .in('id', ids);
      if (!data) return;
      setItems(prev => prev.map(item => {
        const fresh = data.find((r: Record<string, unknown>) => r.id === item.book.id);
        if (!fresh) return item;
        const isReservedSoldOut = Number(fresh.reserved) === 1;
        const isVisibilityReserved = fresh.visibility === 'Reserved';
        const available = (isReservedSoldOut || isVisibilityReserved)
          ? 0
          : Math.max(0, Number(fresh.inventory) - Number(fresh.reserved));
        const soldOut = available <= 0;
        const cappedQty = soldOut ? item.qty : Math.min(item.qty, available);
        return {
          ...item,
          qty: cappedQty,
          soldOut,
          book: {
            ...item.book,
            inventory: Number(fresh.inventory),
            reserved: Number(fresh.reserved),
            available,
          },
        };
      }));
    } catch {
      // ignore
    }
  }, [items]);

  const total = items
    .filter(i => !i.soldOut)
    .reduce((s, i) => s + i.book.final_srp * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, refreshCartStock }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return React.useContext(CartContext);
}

// ── Wishlist Account Prompt Modal ─────────────────────────
interface WishlistPromptProps {
  bookId: string;
  onClose: () => void;
  onSaved: () => void;
}

const WISHLIST_KEY = 'ds-wishlist';
const WISHLIST_ACCOUNT_KEY = 'ds-wishlist-account';

function WishlistAccountPrompt({ bookId, onClose, onSaved }: WishlistPromptProps) {
  const [tiktok, setTiktok] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = tiktok.trim();
    if (!handle) { setError('Please enter your TikTok handle.'); return; }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); return; }

    // Save account info
    localStorage.setItem(WISHLIST_ACCOUNT_KEY, JSON.stringify({ tiktok: handle, pin }));

    // Save book to wishlist
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]') as string[];
      if (!stored.includes(bookId)) {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify([...stored, bookId]));
      }
    } catch { /* ignore */ }

    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(44,26,14,0.97)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl animate-fade-in-up"
        style={{ background: '#3A2214', border: '1px solid rgba(200,164,91,0.4)', boxShadow: '0 8px 40px rgba(44,26,14,0.5)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(200,164,91,0.25)' }}>
          <div className="flex items-center gap-2">
            <span style={{ color: '#E8C97A', fontSize: '18px' }}>♡</span>
            <span className="font-display text-sm font-bold" style={{ color: '#F0DFC4' }}>Save to Wishlist</span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg" style={{ color: '#C8A45B' }}>
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm mb-5" style={{ color: '#D4B896', lineHeight: '1.6' }}>
            Enter your TikTok handle and a 4-digit PIN to save this book to your wishlist.
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>TikTok Handle</label>
              <input
                type="text"
                required
                value={tiktok}
                onChange={e => setTiktok(e.target.value)}
                className="input-field text-sm"
                placeholder="@yourtiktok"
                autoFocus
                style={{ background: '#2C1A0E', borderColor: 'rgba(200,164,91,0.4)', color: '#F0DFC4' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>4-Digit PIN</label>
              <input
                type="password"
                required
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="input-field text-sm text-center tracking-widest"
                placeholder="••••"
                style={{ background: '#2C1A0E', borderColor: 'rgba(200,164,91,0.4)', color: '#F0DFC4' }}
              />
            </div>
            {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
            <button type="submit" className="btn-primary w-full py-2.5 text-sm">Save to Wishlist ♡</button>
            <button type="button" onClick={onClose} className="w-full text-xs text-center" style={{ color: '#A08070', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export { WishlistAccountPrompt, WISHLIST_KEY, WISHLIST_ACCOUNT_KEY };

// ── Admin Access Overlay ───────────────────────────────────
function AdminAccessOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'auth' | 'enter-pin' | 'set-pin'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pendingAdminId, setPendingAdminId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_ACCESS_CODE = 'DADSHELF';

  async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const handleCodeVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim().toUpperCase() !== ADMIN_ACCESS_CODE) {
      setError('Invalid access code.');
      return;
    }
    setError('');
    setStep('auth');
  };

  const handleCheckHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const rawHandle = tiktok.trim();
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
        setStep('set-pin');
      } else {
        setStep('enter-pin');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: adminUser, error: dbError } = await supabase
        .from('admin_users')
        .select('id, tiktok_handle, pin_hash, pin_set, role, is_active')
        .eq('id', pendingAdminId)
        .single();
      if (dbError || !adminUser) throw new Error('Admin account not found.');
      const pinHash = await hashPin(adminPin);
      if (pinHash !== adminUser.pin_hash) throw new Error('Incorrect PIN. Please try again.');
      sessionStorage.setItem('admin_session', JSON.stringify({
        id: adminUser.id,
        tiktok_handle: adminUser.tiktok_handle,
        role: adminUser.role,
        authenticated_at: Date.now(),
      }));
      onClose();
      router.push('/admin/inventory');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

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
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const pinHash = await hashPin(newPin);
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ pin_hash: pinHash, pin_set: true })
        .eq('id', pendingAdminId);
      if (updateError) throw updateError;
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
        onClose();
        router.push('/admin/inventory');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(44,26,14,0.97)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl animate-fade-in-up"
        style={{ background: '#3A2214', border: '1px solid rgba(200,164,91,0.4)', boxShadow: '0 8px 40px rgba(44,26,14,0.5)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <AppLogo size={24} variant="full" />
            <span className="font-display text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>Admin Portal</span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Access Code */}
          {step === 'code' && (
            <form onSubmit={handleCodeVerify} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C8A45B' }}>Step 1 of 2</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: '#F0DFC4' }}>Enter Access Code</h3>
              </div>
              <input
                type="password"
                required
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                className="input-field text-center tracking-widest"
                placeholder="••••••••"
                autoFocus
              />
              {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
              <button type="submit" className="btn-primary w-full py-2.5 text-sm">Verify Code</button>
            </form>
          )}

          {/* Step 2: TikTok Handle only */}
          {step === 'auth' && (
            <form onSubmit={handleCheckHandle} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C8A45B' }}>Step 2 of 2</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: '#F0DFC4' }}>Admin Authentication</h3>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>TikTok Handle</label>
                <input
                  type="text"
                  required
                  value={tiktok}
                  onChange={e => setTiktok(e.target.value)}
                  className="input-field text-sm"
                  placeholder="@yourtiktok"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Verifying...' : 'Continue →'}
              </button>
              <button type="button" onClick={() => { setStep('code'); setError(''); }} className="w-full text-xs text-center" style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Back
              </button>
            </form>
          )}

          {/* Step 3a: Returning admin — Enter PIN */}
          {step === 'enter-pin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C8A45B' }}>Admin PIN</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: '#F0DFC4' }}>Enter Your PIN</h3>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>6-Digit Admin PIN</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-sm text-center tracking-widest"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Verifying...' : 'Sign In ✦'}
              </button>
              <button type="button" onClick={() => { setStep('auth'); setError(''); setAdminPin(''); }} className="w-full text-xs text-center" style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Back
              </button>
            </form>
          )}

          {/* Step 3b: First-time admin — Create PIN */}
          {step === 'set-pin' && (
            <form onSubmit={handleSetPin} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C8A45B' }}>First Time Setup</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: '#F0DFC4' }}>Create Admin PIN</h3>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>Create 6-Digit PIN</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-sm text-center tracking-widest"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>Confirm 6-Digit PIN</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-sm text-center tracking-widest"
                  placeholder="••••••"
                />
              </div>
              {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : 'Create PIN ✦'}
              </button>
              <button type="button" onClick={() => { setStep('auth'); setError(''); setNewPin(''); setConfirmPin(''); }} className="w-full text-xs text-center" style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Preorder Cart Drawer ───────────────────────────────────
function PreorderCartDrawer({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  const { items, removeItem, updateQty, total, refreshCartStock } = useCart();
  const [waitlistHandle, setWaitlistHandle] = useState('');
  const [waitlistBookId, setWaitlistBookId] = useState<string | null>(null);
  const [waitlistBookTitle, setWaitlistBookTitle] = useState('');
  const [waitlistBookSku, setWaitlistBookSku] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState<string[]>([]);

  // Refresh stock when drawer opens
  useEffect(() => {
    refreshCartStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSoldOutItems = items.some(i => i.soldOut);

  const handleJoinWaitlist = async (item: CartItem) => {
    setWaitlistBookId(item.book.id);
    setWaitlistBookTitle(item.book.title);
    setWaitlistBookSku(item.book.sku);
  };

  const submitWaitlist = async () => {
    if (!waitlistHandle.trim() || !waitlistBookId) return;
    setWaitlistLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const handle = waitlistHandle.trim().replace(/^@/, '');
      await supabase.from('waitlist').insert({
        tiktok_handle: '@' + handle,
        book_id: waitlistBookId,
        book_sku: waitlistBookSku,
        book_title: waitlistBookTitle,
      });
      setWaitlistDone(prev => [...prev, waitlistBookId]);
      setWaitlistBookId(null);
      setWaitlistHandle('');
    } catch {
      // ignore
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose} />
      <div
        className="relative w-full max-w-sm h-full overflow-y-auto animate-fade-in flex flex-col"
        style={{ background: 'var(--background-card)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Icon name="ShoppingCartIcon" size={18} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
            <span className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Preorder Cart</span>
            {items.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--primary)', color: '#fff' }}>
                {items.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Sold-out warning banner */}
        {hasSoldOutItems && (
          <div className="mx-4 mt-3 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)' }}>
            <p className="text-xs font-semibold" style={{ color: '#f87171' }}>
              ⚠ Some items in your cart are now out of stock. Please remove them or join the waitlist before checking out.
            </p>
          </div>
        )}

        <div className="flex-1 p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon name="ShoppingCartIcon" size={40} className="mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>Your cart is empty</p>
              <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Add books from the preorder list to get started.</p>
              <button onClick={onClose} className="btn-primary text-xs px-5 py-2 mt-4">Browse Books ✦</button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const isReservedSoldOut = (item.book.reserved ?? 0) === 1;
                const available = isReservedSoldOut ? 0 : Math.max(0, (item.book.inventory ?? 0) - (item.book.reserved ?? 0));
                const alreadyWaitlisted = waitlistDone.includes(item.book.id);
                return (
                  <div
                    key={item.book.id}
                    className="flex items-start gap-3 rounded-xl p-3"
                    style={{
                      background: item.soldOut ? 'rgba(239,68,68,0.05)' : 'rgba(184,134,11,0.05)',
                      border: `1px solid ${item.soldOut ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                      opacity: item.soldOut ? 0.8 : 1,
                    }}
                  >
                    <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden relative" style={{ background: 'var(--muted)' }}>
                      <AppImage src={item.book.cover_url || '/assets/images/no_image.png'} alt={`Cover of ${item.book.title}`} width={40} height={56} className="w-full h-full object-cover" style={{ filter: item.soldOut ? 'grayscale(1)' : 'none' }} />
                      {item.soldOut && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                          <span className="text-xs font-bold" style={{ color: '#f87171', fontSize: '8px', textAlign: 'center', lineHeight: 1.2 }}>OUT OF STOCK</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: item.soldOut ? '#f87171' : 'var(--foreground)' }}>{item.book.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{item.book.author}</p>
                      {item.soldOut ? (
                        <div className="mt-1.5 space-y-1">
                          <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Out of Stock</p>
                          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Browse our other titles or join the waitlist.</p>
                          <div className="flex gap-1.5 mt-1">
                            {!alreadyWaitlisted ? (
                              <button
                                onClick={() => handleJoinWaitlist(item)}
                                className="text-xs px-2 py-1 rounded-lg font-semibold"
                                style={{ background: 'rgba(200,164,91,0.15)', color: '#C8A45B', border: '1px solid rgba(200,164,91,0.4)' }}
                              >
                                Join Waitlist
                              </button>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                ✓ On Waitlist
                              </span>
                            )}
                            <button onClick={() => removeItem(item.book.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>Remove</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--primary-bright)' }}>₱{(item.book.final_srp * item.qty).toLocaleString()}</p>
                      )}
                    </div>
                    {!item.soldOut && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.book.id, item.qty - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                          >−</button>
                          <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--foreground)' }}>{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.book.id, item.qty + 1)}
                            disabled={item.qty >= available}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{
                              background: item.qty >= available ? 'rgba(120,100,80,0.1)' : 'var(--muted)',
                              color: item.qty >= available ? '#9E8E7E' : 'var(--foreground)',
                              cursor: item.qty >= available ? 'not-allowed' : 'pointer',
                            }}
                          >+</button>
                        </div>
                        {available > 0 && (
                          <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{available} left</span>
                        )}
                        <button onClick={() => removeItem(item.book.id)} className="text-xs" style={{ color: '#f87171' }}>Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>Order Total</span>
              <span className="text-lg font-bold" style={{ color: 'var(--primary-bright)' }}>₱{total.toLocaleString()}</span>
            </div>
            {hasSoldOutItems ? (
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Remove out-of-stock items to proceed to checkout.</p>
              </div>
            ) : (
              <button onClick={onCheckout} className="btn-primary w-full py-3 text-sm">
                Proceed to Checkout ✦
              </button>
            )}
            <p className="text-xs text-center mt-2" style={{ color: 'var(--foreground-subtle)' }}>
              GCash payment · Shipping details collected after books arrive in the Philippines
            </p>
          </div>
        )}
      </div>

      {/* Waitlist modal */}
      {waitlistBookId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(44,26,14,0.97)' }}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: '#3A2214', border: '1px solid rgba(200,164,91,0.4)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(200,164,91,0.25)' }}>
              <span className="font-display text-sm font-bold" style={{ color: '#F0DFC4' }}>Join Waitlist</span>
              <button onClick={() => setWaitlistBookId(null)} className="btn-ghost p-1 rounded-lg" style={{ color: '#C8A45B' }}>
                <Icon name="XMarkIcon" size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: '#D4B896' }}>
                We&apos;ll notify you when <strong style={{ color: '#F0DFC4' }}>{waitlistBookTitle}</strong> is back in stock.
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>Your TikTok Handle</label>
                <input
                  type="text"
                  value={waitlistHandle}
                  onChange={e => setWaitlistHandle(e.target.value)}
                  className="input-field text-sm"
                  placeholder="@yourtiktok"
                  autoFocus
                  style={{ background: '#2C1A0E', borderColor: 'rgba(200,164,91,0.4)', color: '#F0DFC4' }}
                />
              </div>
              <button
                onClick={submitWaitlist}
                disabled={waitlistLoading || !waitlistHandle.trim()}
                className="btn-primary w-full py-2.5 text-sm"
                style={{ opacity: waitlistLoading || !waitlistHandle.trim() ? 0.7 : 1 }}
              >
                {waitlistLoading ? 'Joining...' : 'Join Waitlist ✦'}
              </button>
              <button onClick={() => setWaitlistBookId(null)} className="w-full text-xs text-center" style={{ color: '#A08070', background: 'none', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Nav Search with Admin Trigger ─────────────────────────
const ADMIN_TRIGGER = '1DS-ADMIN***';

const NavSearch = React.memo(function NavSearch({ onAdminTrigger }: { onAdminTrigger: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const books = await getBooks({ search: q });
      // Filter out hidden titles — only show visible books
      const visible = books.filter(b => b.is_visible !== false);
      setResults(visible.slice(0, 8));
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    // Check for admin trigger keyword
    if (val === ADMIN_TRIGGER) {
      setQuery('');
      setOpen(false);
      onAdminTrigger();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (book: Book) => {
    setOpen(false);
    setQuery('');
    router.push(`/book-detail?id=${book.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 max-w-md hidden md:flex items-center relative">
      <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3.5 z-10 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
      <input
        type="search"
        placeholder="Search books, authors, genres, Book Code..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="input-field pl-9 py-2 text-sm w-full"
        style={{ borderRadius: '9999px', paddingRight: '1rem' }}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3">
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      )}

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-2xl"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)', maxHeight: '420px', overflowY: 'auto' }}
        >
          {results.map(book => (
            <button
              key={book.id}
              onClick={() => handleSelect(book)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-opacity-80"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,164,91,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden" style={{ background: 'var(--muted)' }}>
                <AppImage src={book.cover_url || '/assets/images/no_image.png'} alt={`Cover of ${book.title}`} width={40} height={56} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{book.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{book.author}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{book.sku}</span>
                  <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>· {book.format}</span>
                  {book.genre && <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>· {book.genre}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>
                {book.is_price_visible !== false ? `₱${Number(book.final_srp).toLocaleString()}` : 'Price TBA'}
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-center">
            <button
              onClick={() => { setOpen(false); router.push(`/shop?search=${encodeURIComponent(query)}`); }}
              className="text-xs font-semibold"
              style={{ color: 'var(--primary-bright)' }}
            >
              View all results for &quot;{query}&quot; →
            </button>
          </div>
        </div>
      )}

      {open && query.trim() && results.length === 0 && !loading && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl z-50 shadow-2xl px-4 py-6 text-center"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No books found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
});

const MobileNavSearch = React.memo(function MobileNavSearch({ onAdminTrigger }: { onAdminTrigger: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const books = await getBooks({ search: q });
      // Filter out hidden titles
      const visible = books.filter(b => b.is_visible !== false);
      setResults(visible.slice(0, 6));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val === ADMIN_TRIGGER) {
      setQuery('');
      setResults([]);
      onAdminTrigger();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (book: Book) => {
    setQuery('');
    setResults([]);
    router.push(`/book-detail?id=${book.id}`);
  };

  return (
    <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="relative">
        <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
        <input
          type="search"
          placeholder="Search books..."
          value={query}
          onChange={handleChange}
          className="input-field pl-9 text-sm"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
          </div>
        )}
      </div>
      {results.length > 0 && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {results.map(book => (
            <button
              key={book.id}
              onClick={() => handleSelect(book)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--background-card)' }}
            >
              <div className="flex-shrink-0 w-8 h-11 rounded overflow-hidden" style={{ background: 'var(--muted)' }}>
                <AppImage src={book.cover_url || '/assets/images/no_image.png'} alt={`Cover of ${book.title}`} width={32} height={44} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{book.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{book.author}</p>
              </div>
              <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--primary-bright)' }}>
                {book.is_price_visible !== false ? `₱${Number(book.final_srp).toLocaleString()}` : 'Price TBA'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Nav Links (no admin) ───────────────────────────────────
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'On Hand', href: '/on-hand' },
  { label: 'Genres', href: '/genres' },
  { label: 'Collections', href: '/collections' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'My Orders', href: '/orders' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminOverlay, setAdminOverlay] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { items } = useCart();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; message: string; type: string }[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  // Load active announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data } = await supabase
          .from('announcements')
          .select('id, title, message, type')
          .eq('is_active', true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`)
          .order('created_at', { ascending: false })
          .limit(3);
        if (data) setAnnouncements(data);
      } catch { /* ignore */ }
    };
    fetchAnnouncements();
  }, []);

  const visibleBanners = announcements.filter(a => !dismissedBanners.includes(a.id));

  const BANNER_COLORS: Record<string, { bg: string; border: string; color: string }> = {
    info: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', color: '#93c5fd' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: '#fcd34d' },
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#6ee7b7' },
    promo: { bg: 'rgba(200,164,91,0.12)', border: 'rgba(200,164,91,0.35)', color: '#C8A45B' },
    urgent: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', color: '#fca5a5' },
  };

  const handleAdminTrigger = useCallback(() => {
    setMobileOpen(false);
    setAdminOverlay(true);
  }, []);

  const handleCheckout = useCallback(() => {
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);

  return (
    <>
      {/* Announcement Banners */}
      {visibleBanners.map(banner => {
        const style = BANNER_COLORS[banner.type] ?? BANNER_COLORS.info;
        return (
          <div
            key={banner.id}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-xs"
            style={{ background: style.bg, borderBottom: `1px solid ${style.border}`, color: style.color }}
          >
            <div className="flex-1 text-center">
              <strong>{banner.title}:</strong> {banner.message}
            </div>
            <button
              onClick={() => setDismissedBanners(prev => [...prev, banner.id])}
              className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100"
              style={{ color: style.color }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <nav
        className="fixed left-0 right-0 z-40"
        style={{
          top: visibleBanners.length > 0 ? `${visibleBanners.length * 36}px` : '0px',
          background: 'linear-gradient(180deg, rgba(20,12,4,0.98) 0%, rgba(20,12,4,0.94) 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
          transition: 'top 0.2s',
        }}
      >
        <div className="content-wrapper">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <AppLogo size={44} variant="full" />
              <span className="font-display text-base font-bold hidden sm:block" style={{ color: 'var(--primary-bright)' }}>Daddee&apos;s Shelf</span>
            </Link>

            {/* Live Search Bar */}
            <NavSearch onAdminTrigger={handleAdminTrigger} />

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-1 flex-shrink-0">
              {NAV_LINKS.slice(0, 7).map(link => (
                <Link
                  key={`nav-${link.href}`}
                  href={link.href}
                  className={`nav-link px-3 py-1.5 rounded-lg text-xs ${pathname === link.href ? 'active' : ''}`}
                  style={pathname === link.href ? { background: 'var(--primary-glow)' } : {}}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Preorder Cart + Mobile Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCartOpen(true)}
                className="btn-ghost p-2 rounded-lg hidden sm:flex relative"
                aria-label="Preorder Cart"
                suppressHydrationWarning
              >
                <Icon name="ShoppingCartIcon" size={18} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px' }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="btn-ghost p-2 rounded-lg xl:hidden"
                aria-label="Open menu"
                suppressHydrationWarning
              >
                <Icon name="Bars3Icon" size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative ml-auto w-72 h-full overflow-y-auto animate-fade-in"
            style={{ background: 'rgba(44,26,14,0.97)', borderLeft: '1px solid rgba(200,164,91,0.3)', backdropFilter: 'blur(16px)' }}
          >
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(200,164,91,0.25)' }}>
              <span className="font-display text-base font-semibold" style={{ color: '#F0DFC4' }}>Navigation</span>
              <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1" style={{ color: '#C8A45B' }}>
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            <MobileNavSearch onAdminTrigger={handleAdminTrigger} />

            {/* Cart button in mobile */}
            <div className="px-3 pt-3">
              <button
                onClick={() => { setMobileOpen(false); setCartOpen(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm btn-primary"
              >
                <Icon name="ShoppingCartIcon" size={16} />
                <span>Preorder Cart</span>
                {cartCount > 0 && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            <div className="p-3 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={`mobile-nav-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all`}
                  style={pathname === link.href
                    ? { background: 'rgba(200,164,91,0.25)', color: '#F0DFC4', fontWeight: 600 }
                    : { color: '#D4B896' }
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preorder Cart Drawer */}
      {cartOpen && (
        <PreorderCartDrawer
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
        />
      )}

      {/* Admin Access Overlay */}
      {adminOverlay && (
        <AdminAccessOverlay onClose={() => setAdminOverlay(false)} />
      )}

      {/* Checkout Modal — rendered inline via preorder-list page */}
      {checkoutOpen && (
        <CheckoutRedirectModal onClose={() => setCheckoutOpen(false)} />
      )}
    </>
  );
}

// ── Checkout Redirect Modal ────────────────────────────────
function CheckoutRedirectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    tiktok_handle: '',
    customer_pin: '',
    payment_ref: '',
    notes: '',
    user_slug: '',
  });
  const [confirmation, setConfirmation] = useState<{ order_ref: string; tiktok_handle: string; user_slug: string; is_new_slug: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

  // ── Existing slug check ───────────────────────────────────
  const [existingSlug, setExistingSlug] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugCheckRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Store Credit ──────────────────────────────────────────
  const [storeCredit, setStoreCredit] = useState<{ id: string; amount: number } | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const creditLookupRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawTotal = items.filter(i => !i.soldOut).reduce((s, i) => s + i.book.final_srp * i.qty, 0);
  const creditApplied = storeCredit ? Math.min(storeCredit.amount, rawTotal) : 0;
  const total = Math.max(0, rawTotal - creditApplied);

  // Check for existing slug when handle changes
  useEffect(() => {
    if (slugCheckRef.current) clearTimeout(slugCheckRef.current);
    const handle = form.tiktok_handle.trim();
    if (!handle) { setExistingSlug(null); return; }
    slugCheckRef.current = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const { supabase: sb } = await import('@/lib/supabase');
        const rawHandle = handle.replace(/^@/, '');
        const handleWithAt = '@' + rawHandle;
        const { data } = await sb
          .from('customer_slugs')
          .select('user_slug')
          .or(`tiktok_handle.eq.${rawHandle},tiktok_handle.eq.${handleWithAt}`)
          .maybeSingle();
        setExistingSlug(data?.user_slug ?? null);
      } catch { setExistingSlug(null); }
      setSlugChecking(false);
    }, 600);
    return () => { if (slugCheckRef.current) clearTimeout(slugCheckRef.current); };
  }, [form.tiktok_handle]);

  // Lookup store credit whenever tiktok_handle changes (debounced)
  useEffect(() => {
    if (creditLookupRef.current) clearTimeout(creditLookupRef.current);
    const handle = form.tiktok_handle.trim();
    if (!handle) {
      setStoreCredit(null);
      return;
    }
    creditLookupRef.current = setTimeout(async () => {
      setCreditLoading(true);
      try {
        const { supabase: sb } = await import('@/lib/supabase');
        const rawHandle = handle.replace(/^@/, '');
        const handleWithAt = '@' + rawHandle;
        const { data } = await sb
          .from('store_credits')
          .select('id, amount, tiktok_handle')
          .eq('is_active', true)
          .eq('status', 'Active')
          .is('used_on_order_ref', null)
          .or(`tiktok_handle.eq.${rawHandle},tiktok_handle.eq.${handleWithAt}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setStoreCredit(data ? { id: data.id, amount: Number(data.amount) } : null);
      } catch {
        setStoreCredit(null);
      } finally {
        setCreditLoading(false);
      }
    }, 600);
    return () => {
      if (creditLookupRef.current) clearTimeout(creditLookupRef.current);
    };
  }, [form.tiktok_handle]);

  async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'daddees-shelf-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateOrderRef(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
    return `DDS-${date}-${seq}`;
  }

  function generateUserSlug(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let slug = 'DS-';
    for (let i = 0; i < 8; i++) {
      slug += chars[Math.floor(Math.random() * chars.length)];
    }
    return slug;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tiktok_handle.trim()) { setError('TikTok Handle is required.'); return; }
    if (form.customer_pin.length !== 4 || !/^\d{4}$/.test(form.customer_pin)) {
      setError('PIN must be exactly 4 digits.'); return;
    }
    if (!form.payment_ref.trim()) { setError('GCash Reference Number is required.'); return; }

    // If returning customer (has existing slug), require them to enter it
    if (existingSlug && !form.user_slug.trim()) {
      setError('Please enter your User ID. Returning customers must provide their User ID to proceed.');
      return;
    }
    if (existingSlug && form.user_slug.trim().toUpperCase() !== existingSlug.toUpperCase()) {
      setError('User ID does not match our records. Please check and try again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { supabase: sb } = await import('@/lib/supabase');

      // ── Stock validation at checkout time ──────────────────
      const checkableItems = items.filter(i => !i.soldOut);
      const bookIds = checkableItems.map(i => i.book.id);
      const { data: freshBooks } = await sb
        .from('books')
        .select('id, inventory, reserved, visibility')
        .in('id', bookIds);

      if (freshBooks) {
        const soldOutTitles: string[] = [];
        for (const item of checkableItems) {
          const fresh = freshBooks.find((b: Record<string, unknown>) => b.id === item.book.id);
          if (!fresh) continue;
          const isReservedSoldOut = Number(fresh.reserved) === 1;
          const isVisibilityReserved = fresh.visibility === 'Reserved';
          const available = (isReservedSoldOut || isVisibilityReserved)
            ? 0
            : Math.max(0, Number(fresh.inventory) - Number(fresh.reserved));
          if (available <= 0) {
            soldOutTitles.push(item.book.title);
            await sb.from('books').update({ visibility: 'Reserved' }).eq('id', item.book.id);
          } else if (item.qty > available) {
            setError(`"${item.book.title}" only has ${available} cop${available === 1 ? 'y' : 'ies'} available. Please update your cart.`);
            setSubmitting(false);
            return;
          }
        }
        if (soldOutTitles.length > 0) {
          setError(`The following title(s) are now sold out: ${soldOutTitles.join(', ')}. Please remove them from your cart.`);
          setSubmitting(false);
          return;
        }
      }

      const orderRef = generateOrderRef();
      const hashedPin = await hashPin(form.customer_pin);
      const rawHandle = form.tiktok_handle.trim().replace(/^@/, '');
      const normalizedHandle = '@' + rawHandle;
      const orderItems = checkableItems.map(i => ({
        sku: i.book.sku,
        title: i.book.title,
        qty: i.qty,
        price: i.book.final_srp,
        batch: i.book.batch,
      }));

      const { error: err } = await sb.from('orders').insert({
        ref_number: orderRef,
        customer_name: normalizedHandle,
        tiktok_handle: normalizedHandle,
        customer_pin: hashedPin,
        items: orderItems,
        total_price: total,
        payment_method: 'GCash',
        payment_ref: form.payment_ref,
        notes: form.notes,
        status: 'Pending Payment Verification',
        is_preorder: true,
        store_credit_applied: creditApplied > 0 ? creditApplied : 0,
        store_credit_id: creditApplied > 0 && storeCredit ? storeCredit.id : null,
      });
      if (err) throw err;

      // Mark store credit as used
      if (creditApplied > 0 && storeCredit) {
        await sb
          .from('store_credits')
          .update({ used_on_order_ref: orderRef, status: 'Used', is_active: false })
          .eq('id', storeCredit.id);
      }

      // ── User Slug: generate if new, use existing if returning ──
      let finalSlug = existingSlug;
      let isNewSlug = false;
      if (!existingSlug) {
        // Generate unique slug
        let newSlug = generateUserSlug();
        let attempts = 0;
        while (attempts < 5) {
          const { data: existing } = await sb.from('customer_slugs').select('id').eq('user_slug', newSlug).maybeSingle();
          if (!existing) break;
          newSlug = generateUserSlug();
          attempts++;
        }
        await sb.from('customer_slugs').insert({ tiktok_handle: normalizedHandle, user_slug: newSlug });
        finalSlug = newSlug;
        isNewSlug = true;
      }

      clearCart();
      setConfirmation({ order_ref: orderRef, tiktok_handle: normalizedHandle, user_slug: finalSlug ?? '', is_new_slug: isNewSlug });
    } catch {
      setError('Something went wrong. Please try again or message us on TikTok @daddees.shelf.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(10,6,2,0.97)' }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#1a0e06', border: '1px solid rgba(184,134,11,0.5)' }}>
          <div className="px-6 py-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(184,134,11,0.2), rgba(139,69,19,0.15))', borderBottom: '1px solid rgba(184,134,11,0.3)' }}>
            <div className="text-4xl mb-2">✓</div>
            <h2 className="font-display text-xl font-bold" style={{ color: '#F0DFC4' }}>Preorder Submitted!</h2>
            <p className="text-xs mt-1" style={{ color: '#C8A45B' }}>Your order is pending payment verification</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.3)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#C8A45B' }}>Order Reference</p>
              <p className="font-display text-2xl font-bold" style={{ color: '#F0DFC4' }}>{confirmation.order_ref}</p>
            </div>

            {/* User Slug — show prominently for new slugs */}
            {confirmation.user_slug && (
              <div className="rounded-xl p-4" style={{ background: confirmation.is_new_slug ? 'rgba(139,92,246,0.15)' : 'rgba(184,134,11,0.08)', border: `1px solid ${confirmation.is_new_slug ? 'rgba(139,92,246,0.5)' : 'rgba(184,134,11,0.3)'}` }}>
                <p className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: confirmation.is_new_slug ? '#a78bfa' : '#C8A45B' }}>
                  {confirmation.is_new_slug ? '🆔 Your New User ID' : '🆔 Your User ID'}
                </p>
                <p className="font-display text-xl font-bold text-center mb-2" style={{ color: '#F0DFC4', letterSpacing: '0.1em' }}>{confirmation.user_slug}</p>
                {confirmation.is_new_slug && (
                  <p className="text-xs leading-relaxed mb-2" style={{ color: '#D4B896' }}>
                    <strong style={{ color: '#f87171' }}>⚠ Save this User ID!</strong> You will need it for all future orders. Screenshot this screen or copy it now.
                  </p>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(confirmation.user_slug).then(() => {
                      setSlugCopied(true);
                      setTimeout(() => setSlugCopied(false), 2000);
                    });
                  }}
                  className="w-full py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' }}
                >
                  {slugCopied ? '✓ Copied!' : 'Copy User ID'}
                </button>
              </div>
            )}

            {/* TikTok screenshot instruction */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)' }}>
              <p className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: '#f87171' }}>
                <span>📸</span> Important Next Step
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#F0DFC4' }}>
                <strong>Screenshot this screen</strong> showing your payment reference number{confirmation.is_new_slug ? ' and User ID' : ''}, then send it to us on TikTok at{' '}
                <strong style={{ color: '#C8A45B' }}>@daddees.shelf</strong> so we can verify your payment.
              </p>
            </div>

            <p className="text-xs text-center" style={{ color: '#C8A45B' }}>
              Use your 4-digit PIN to track your order at <strong style={{ color: '#F0DFC4' }}>My Orders</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(confirmation.order_ref).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(184,134,11,0.2)', color: '#F0DFC4', border: '1px solid rgba(184,134,11,0.4)' }}
              >
                {copied ? '✓ Copied!' : 'Copy Ref'}
              </button>
              <button
                onClick={() => { onClose(); router.push('/orders'); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(184,134,11,0.8)', color: '#1a0a00' }}
              >
                Track Order
              </button>
            </div>
            <button onClick={onClose} className="w-full text-xs py-2" style={{ color: '#8a7060' }}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(10,6,2,0.97)' }}>
      <div className="relative w-full max-w-lg rounded-2xl" style={{ background: '#1a0e06', border: '1px solid rgba(184,134,11,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ background: '#1a0e06', borderBottom: '1px solid rgba(184,134,11,0.25)', zIndex: 1 }}>
          <h2 className="font-display text-lg font-bold" style={{ color: '#F0DFC4' }}>Checkout</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#C8A45B' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Cart summary */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(184,134,11,0.2)', background: 'rgba(184,134,11,0.04)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#C8A45B' }}>Your Cart ({items.filter(i => !i.soldOut).length} {items.filter(i => !i.soldOut).length === 1 ? 'title' : 'titles'})</p>
          {items.filter(i => !i.soldOut).map((item, i) => (
            <div key={i} className="flex justify-between text-xs mb-1">
              <span style={{ color: '#D4B896' }}>{item.book.title} × {item.qty}</span>
              <span style={{ color: '#F0DFC4', fontWeight: 600 }}>₱{(item.book.final_srp * item.qty).toLocaleString()}</span>
            </div>
          ))}
          {/* Store credit deduction row */}
          {creditApplied > 0 && (
            <div className="flex justify-between text-xs mt-1">
              <span style={{ color: '#10b981' }}>Store Credit Applied</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>−₱{creditApplied.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold mt-2 pt-2" style={{ borderTop: '1px solid rgba(184,134,11,0.2)' }}>
            <span style={{ color: '#F0DFC4' }}>Total</span>
            <span style={{ color: '#C8A45B' }}>₱{total.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* TikTok Handle */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>
              TikTok Handle <span style={{ color: '#f59e0b' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.tiktok_handle}
              onChange={e => setForm(f => ({ ...f, tiktok_handle: e.target.value }))}
              className="input-field text-sm"
              placeholder="@yourtiktok"
            />
            <p className="text-xs mt-1" style={{ color: '#8a7060' }}>You must be a follower of @daddees.shelf to place preorders.</p>

            {/* Slug check indicator */}
            {form.tiktok_handle.trim() && (
              <div className="mt-2">
                {slugChecking ? (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: '#8a7060' }}>
                    <span className="inline-block w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: '#8a7060' }} />
                    Checking account…
                  </p>
                ) : existingSlug ? (
                  <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.35)' }}>
                    <p className="text-xs font-semibold" style={{ color: '#a78bfa' }}>
                      ✦ Returning customer detected. Please enter your User ID below.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: '#10b981' }}>✦ New customer — a User ID will be assigned after your order.</p>
                )}
              </div>
            )}

            {/* Store credit status indicator */}
            {form.tiktok_handle.trim() && (
              <div className="mt-2">
                {creditLoading ? (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: '#8a7060' }}>
                    <span className="inline-block w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: '#8a7060' }} />
                    Checking for store credit…
                  </p>
                ) : storeCredit ? (
                  <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)' }}>
                    <span style={{ color: '#10b981' }}>✦</span>
                    <p className="text-xs font-semibold" style={{ color: '#10b981' }}>
                      Store credit found: <span className="font-bold">₱{storeCredit.amount.toLocaleString()}</span> will be deducted from your total.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: '#8a7060' }}>No active store credit found for this handle.</p>
                )}
              </div>
            )}
          </div>

          {/* User Slug — required for returning customers */}
          {existingSlug && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>
                User ID <span style={{ color: '#f59e0b' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.user_slug}
                onChange={e => setForm(f => ({ ...f, user_slug: e.target.value.toUpperCase() }))}
                className="input-field text-sm text-center tracking-widest"
                placeholder="DS-XXXXXXXX"
                style={{ fontFamily: 'monospace' }}
              />
              <p className="text-xs mt-1" style={{ color: '#8a7060' }}>Enter the User ID you received on your first order.</p>
            </div>
          )}

          {/* PIN */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>
              4-Digit PIN <span style={{ color: '#f59e0b' }}>*</span>
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={form.customer_pin}
              onChange={e => setForm(f => ({ ...f, customer_pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              className="input-field text-sm text-center tracking-widest"
              placeholder="••••"
              inputMode="numeric"
            />
            <p className="text-xs mt-1" style={{ color: '#8a7060' }}>Remember this PIN — you will use it to track your order in My Orders.</p>
          </div>

          {/* GCash QR */}
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#10b981' }}>✦ GCash Payment Instructions</p>
            <div className="w-44 h-44 mx-auto rounded-xl mb-3 overflow-hidden" style={{ border: '2px solid rgba(16,185,129,0.4)' }}>
              <AppImage
                src="/assets/images/36c6a594-8ce5-4d14-8600-0e7b65f58ff0-1786006380177.jpg"
                alt="GCash QR code for Daddee's Shelf payment"
                width={176}
                height={176}
                className="w-full h-full object-cover"
              />
            </div>
            <ol className="text-xs text-left space-y-1.5 max-w-xs mx-auto" style={{ color: '#D4B896' }}>
              <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>1.</span> Scan the QR code with your GCash app</li>
              <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>2.</span> Send the exact total amount</li>
              <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>3.</span> Copy your GCash Reference Number</li>
              <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>4.</span> Paste it in the field below</li>
            </ol>
          </div>

          {/* Payment Reference */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>
              GCash Reference Number <span style={{ color: '#f59e0b' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.payment_ref}
              onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))}
              className="input-field text-sm"
              placeholder="e.g. 1234567890"
            />
            <p className="text-xs mt-1" style={{ color: '#8a7060' }}>Copy the reference number from your GCash transaction receipt.</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C8A45B' }}>
              Notes <span className="text-xs font-normal" style={{ color: '#8a7060' }}>(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field text-sm resize-none"
              placeholder="Any special instructions..."
            />
          </div>

          <div className="rounded-xl p-3" style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.2)' }}>
            <p className="text-xs" style={{ color: '#D4B896' }}>
              <strong style={{ color: '#F0DFC4' }}>Note:</strong> Shipping details will be collected after your books arrive. Supported couriers: J&T Express (Nationwide) and Lalamove (Metro Manila / Nearby Areas).
            </p>
          </div>

          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-sm"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Submit Preorder ✦'}
          </button>
        </form>
      </div>
    </div>
  );
}