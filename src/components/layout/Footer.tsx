import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

// Navigation data — keep in sync with Navbar.tsx NAV_LINKS
const FOOTER_BROWSE_LINKS = [
  { label: 'Shop All Books', href: '/shop' },
  { label: 'Genres', href: '/genres' },
  { label: 'Collections', href: '/collections' },
  { label: 'Available Now', href: '/available-now' },
];

const FOOTER_ACCOUNT_LINKS = [
  { label: 'My Wishlist', href: '/wishlist' },
  { label: 'My Orders', href: '/orders' },
  { label: 'Request a Title', href: '/request' },
];

const FOOTER_SUPPORT_LINKS = [
  { label: 'FAQs', href: '/faqs' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

// Helper: only render links that have both a label and an href
function isValidLink(link: unknown): link is { label: string; href: string } {
  if (!link || typeof link !== 'object') return false;
  const l = link as Record<string, unknown>;
  return typeof l.label === 'string' && l.label.trim() !== '' &&
         typeof l.href === 'string' && l.href.trim() !== '';
}

// TikTok icon (SVG) — inline since heroicons doesn't include TikTok
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      className="relative z-10 mt-24"
      style={{ borderTop: '1px solid var(--border)', background: 'rgba(15,9,3,0.97)' }}
    >
      <div className="content-wrapper py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <AppLogo size={28} />
              <span className="font-display text-base font-semibold" style={{ color: 'var(--primary-bright)' }}>
                Daddee&apos;s Shelf
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)', lineHeight: '1.6' }}>
              Your cozy corner for pre-loved and pre-ordered books. Making books accessible to Filipino readers.
            </p>
            {/* TikTok only — Facebook and Instagram are hidden until re-enabled via Admin Dashboard */}
            <div className="flex gap-3 mt-4">
              <a
                href="https://tiktok.com/@daddees.shelf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost p-2 rounded-lg flex items-center gap-1.5"
                aria-label="TikTok @daddees.shelf"
                title="@daddees.shelf on TikTok"
              >
                <TikTokIcon size={15} />
                <span className="text-xs" style={{ color: 'var(--primary-bright)' }}>TikTok</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
              Browse
            </h4>
            <div className="flex flex-col gap-2">
              {FOOTER_BROWSE_LINKS.filter(isValidLink).map(link => (
                <Link key={`footer-browse-${link.href}`} href={link.href} className="nav-link text-sm">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
              Account
            </h4>
            <div className="flex flex-col gap-2">
              {FOOTER_ACCOUNT_LINKS.filter(isValidLink).map(link => (
                <Link key={`footer-account-${link.href}`} href={link.href} className="nav-link text-sm">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
              Support
            </h4>
            <div className="flex flex-col gap-2">
              {FOOTER_SUPPORT_LINKS.filter(isValidLink).map(link => (
                <Link key={`footer-support-${link.href}`} href={link.href} className="nav-link text-sm">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                Mon–Sat · 9AM–6PM
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                Online only · Philippines
              </p>
            </div>
          </div>

          {/* Shipping Information */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
              Shipping
            </h4>
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--primary-bright)' }}>
                Nationwide Shipping Available
              </p>
              <div className="space-y-1.5">
                <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>✦</span>
                  Metro Manila via Lalamove
                </p>
                <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>✦</span>
                  Provincial via J&amp;T Express
                </p>
                <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>✦</span>
                  Fees collected once books arrive
                </p>
                <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--foreground-subtle)', lineHeight: '1.5' }}>
                  <span style={{ flexShrink: 0 }}>ℹ</span>
                  ETA dates are tentative and subject to international shipping &amp; customs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
            © 2026 Daddee&apos;s Shelf. All rights reserved.
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-subtle)' }}>
            <span>✦</span>
            Made with love for Filipino readers
            <span>✦</span>
          </p>
        </div>
      </div>
    </footer>
  );
}