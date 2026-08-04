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
  { label: 'My Preorders', href: '/orders' },
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

export default function Footer() {
  return (
    <footer
      className="relative z-10 mt-24"
      style={{ borderTop: '1px solid var(--border)', background: 'rgba(10,10,15,0.95)' }}
    >
      <div className="content-wrapper py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
            <div className="flex gap-3 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost p-2 rounded-lg"
                aria-label="Facebook"
              >
                <span className="text-sm" style={{ color: 'var(--primary-bright)' }}>fb</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost p-2 rounded-lg"
                aria-label="Instagram"
              >
                <span className="text-sm" style={{ color: 'var(--primary-bright)' }}>ig</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)' }}>
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
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)' }}>
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
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)' }}>
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