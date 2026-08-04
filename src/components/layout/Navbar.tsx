'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Available Now', href: '/available-now' },
  { label: 'Genres', href: '/genres' },
  { label: 'Collections', href: '/collections' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Preorder List', href: '/preorder-list' },
  { label: 'My Preorders', href: '/orders' },
  { label: 'Request a Title', href: '/request' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

function NavSearch() {
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
      <Icon
        name="MagnifyingGlassIcon"
        size={16}
        className="absolute left-3 z-10 pointer-events-none"
        style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties}
      />
      <input
        type="search"
        placeholder="Search books, authors, genres..."
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

      {/* Floating dropdown */}
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
                <AppImage
                  src={book.cover_url || '/assets/images/no_image.png'}
                  alt={`Cover of ${book.title}`}
                  width={40}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{book.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{book.author}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{book.format}</span>
                  {book.batch && (
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>· {book.batch}</span>
                  )}
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

function MobileNavSearch() {
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
        <Icon
          name="MagnifyingGlassIcon"
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties}
        />
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
                <AppImage
                  src={book.cover_url || '/assets/images/no_image.png'}
                  alt={`Cover of ${book.title}`}
                  width={32}
                  height={44}
                  className="w-full h-full object-cover"
                />
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

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <AppLogo size={32} />
              <span
                className="font-display text-lg font-semibold animate-glow-pulse hidden sm:block"
                style={{ color: 'var(--primary-bright)' }}
              >
                Daddee&apos;s Shelf
              </span>
            </Link>

            {/* Live Search Bar */}
            <NavSearch />

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

            {/* Wishlist + Mobile Toggle */}
            <div className="flex items-center gap-2">
              <Link
                href="/wishlist"
                className="btn-ghost p-2 rounded-lg hidden sm:flex"
                aria-label="Wishlist"
              >
                <Icon name="HeartIcon" size={18} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
              </Link>
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
              <span className="font-display text-base font-semibold" style={{ color: 'var(--primary-bright)' }}>
                Navigation
              </span>
              <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1">
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            {/* Mobile Live Search */}
            <MobileNavSearch />

            {/* Customer nav links */}
            <div className="p-3 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={`mobile-nav-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    pathname === link.href ? 'active' : 'nav-link'
                  }`}
                  style={pathname === link.href ? { background: 'var(--primary-glow)', color: 'var(--primary-bright)' } : {}}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}