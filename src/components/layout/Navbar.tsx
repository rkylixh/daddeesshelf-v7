'use client';

import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
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
}

interface CartContextValue {
  items: CartItem[];
  addItem: (book: Book) => void;
  removeItem: (bookId: string) => void;
  updateQty: (bookId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
}

export const CartContext = React.createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  total: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((book: Book) => {
    setItems(prev => {
      const existing = prev.find(i => i.book.id === book.id);
      if (existing) return prev.map(i => i.book.id === book.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { book, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((bookId: string) => {
    setItems(prev => prev.filter(i => i.book.id !== bookId));
  }, []);

  const updateQty = useCallback((bookId: string, qty: number) => {
    if (qty <= 0) { removeItem(bookId); return; }
    setItems(prev => prev.map(i => i.book.id === bookId ? { ...i, qty } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.book.final_srp * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return React.useContext(CartContext);
}

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
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl animate-fade-in-up"
        style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 8px 40px rgba(139,92,246,0.2)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <AppLogo size={24} />
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
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>Step 1 of 2</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: 'var(--foreground)' }}>Enter Access Code</h3>
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
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>Step 2 of 2</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: 'var(--foreground)' }}>Admin Authentication</h3>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>TikTok Handle</label>
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
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>Admin PIN</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: 'var(--foreground)' }}>Enter Your PIN</h3>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>6-Digit Admin PIN</label>
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
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>First Time Setup</p>
                <h3 className="font-display text-base font-bold mt-1" style={{ color: 'var(--foreground)' }}>Create Admin PIN</h3>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Create 6-Digit PIN</label>
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Confirm 6-Digit PIN</label>
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
  const { items, removeItem, updateQty, total } = useCart();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
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
              {items.map(item => (
                <div
                  key={item.book.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid var(--border)' }}
                >
                  <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <AppImage src={item.book.cover_url || '/assets/images/no_image.png'} alt={`Cover of ${item.book.title}`} width={40} height={56} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{item.book.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{item.book.author}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--primary-bright)' }}>₱{(item.book.final_srp * item.qty).toLocaleString()}</p>
                  </div>
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
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                      >+</button>
                    </div>
                    <button onClick={() => removeItem(item.book.id)} className="text-xs" style={{ color: '#f87171' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>Order Total</span>
              <span className="text-lg font-bold" style={{ color: 'var(--primary-bright)' }}>₱{total.toLocaleString()}</span>
            </div>
            <button onClick={onCheckout} className="btn-primary w-full py-3 text-sm">
              Proceed to Checkout ✦
            </button>
            <p className="text-xs text-center mt-2" style={{ color: 'var(--foreground-subtle)' }}>
              GCash payment · Shipping details collected after books arrive in the Philippines
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Nav Search with Admin Trigger ─────────────────────────
const ADMIN_TRIGGER = '1DS-ADMIN***';

function NavSearch({ onAdminTrigger }: { onAdminTrigger: () => void }) {
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
      setResults(books.slice(0, 8));
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
      <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 z-10 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
      <input
        type="search"
        placeholder="Search books, authors, genres, Book Code..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="input-field pl-9 pr-4 py-2 text-sm w-full"
        style={{ borderRadius: '9999px' }}
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
          style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)', maxHeight: '420px', overflowY: 'auto' }}
        >
          {results.map(book => (
            <button
              key={book.id}
              onClick={() => handleSelect(book)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-opacity-80"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
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
                ₱{Number(book.final_srp).toLocaleString()}
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
          style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No books found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

function MobileNavSearch({ onAdminTrigger }: { onAdminTrigger: () => void }) {
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
      setResults(books.slice(0, 6));
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
        <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
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
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
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
                ₱{Number(book.final_srp).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Nav Links (no admin) ───────────────────────────────────
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
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
      <nav
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.92) 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="content-wrapper">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <AppLogo size={44} />
              <span className="font-display text-base font-bold hidden sm:block" style={{ color: 'var(--primary-bright)' }}>Daddee&apos;s Shelf</span>
            </Link>

            {/* Live Search Bar */}
            <NavSearch onAdminTrigger={handleAdminTrigger} />

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-1 flex-shrink-0">
              {NAV_LINKS.slice(0, 6).map(link => (
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
            style={{ background: 'var(--background-card)', borderLeft: '1px solid var(--border)' }}
          >
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-display text-base font-semibold" style={{ color: 'var(--primary-bright)' }}>Navigation</span>
              <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${pathname === link.href ? 'active' : 'nav-link'}`}
                  style={pathname === link.href ? { background: 'var(--primary-glow)', color: 'var(--primary-bright)' } : {}}
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
  const { items } = useCart();

  useEffect(() => {
    if (items.length > 0) {
      router.push('/preorder-list');
      onClose();
    }
  }, [items, router, onClose]);

  return null;
}