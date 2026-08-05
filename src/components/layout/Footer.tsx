import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

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

function isValidLink(link: unknown): link is { label: string; href: string } {
  if (!link || typeof link !== 'object') return false;
  const l = link as Record<string, unknown>;
  return typeof l.label === 'string' && l.label.trim() !== '' &&
         typeof l.href === 'string' && l.href.trim() !== '';
}

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

const headingStyle: React.CSSProperties = {
  color: 'rgba(200,164,91,0.75)',
  letterSpacing: '0.14em',
  fontFamily: 'var(--font-display)',
};

const linkStyle: React.CSSProperties = {
  color: 'rgba(247,239,229,0.55)',
  fontFamily: 'var(--font-sans)',
};

export default function Footer() {
  return (
    <footer
      className="relative z-10"
      style={{
        marginTop: '6rem',
        borderTop: '1px solid rgba(200,164,91,0.28)',
        background: 'linear-gradient(180deg, #2C1A0E 0%, #1E1008 100%)',
      }}
    >
      <div
        className="content-wrapper"
        style={{ paddingTop: '4.5rem', paddingBottom: '3rem' }}
      >
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          style={{ gap: '2.5rem' }}
        >
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <AppImage
                src="/assets/images/Untitled_design__7_-1785917477724.png"
                alt="Daddee's Shelf logo"
                width={36}
                height={36}
                className="object-contain"
              />
              <span
                className="font-display text-base font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                Daddee&apos;s Shelf
              </span>
            </div>
            <p
              className="text-sm"
              style={{
                color: 'rgba(247,239,229,0.58)',
                lineHeight: '1.7',
                fontFamily: 'var(--font-serif)',
              }}
            >
              Your cozy corner for pre-loved and pre-ordered books. Making books accessible to Filipino readers.
            </p>
            <div className="mt-5">
              <a
                href="https://tiktok.com/@daddees.shelf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg transition-all"
                style={{
                  gap: '0.625rem',
                  padding: '0.4rem 0.85rem',
                  background: 'rgba(200,164,91,0.1)',
                  border: '1px solid rgba(200,164,91,0.35)',
                  color: 'var(--primary)',
                }}
                aria-label="TikTok @daddees.shelf"
              >
                <TikTokIcon size={14} />
                <span className="text-xs font-medium">TikTok</span>
              </a>
            </div>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-xs font-semibold uppercase mb-5" style={headingStyle}>
              Browse
            </h4>
            <div className="flex flex-col" style={{ gap: '0.65rem' }}>
              {FOOTER_BROWSE_LINKS.filter(isValidLink).map(link => (
                <Link
                  key={`footer-browse-${link.href}`}
                  href={link.href}
                  className="text-sm transition-colors footer-link"
                  style={linkStyle}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase mb-5" style={headingStyle}>
              Account
            </h4>
            <div className="flex flex-col" style={{ gap: '0.65rem' }}>
              {FOOTER_ACCOUNT_LINKS.filter(isValidLink).map(link => (
                <Link
                  key={`footer-account-${link.href}`}
                  href={link.href}
                  className="text-sm transition-colors footer-link"
                  style={linkStyle}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase mb-5" style={headingStyle}>
              Support
            </h4>
            <div className="flex flex-col" style={{ gap: '0.65rem' }}>
              {FOOTER_SUPPORT_LINKS.filter(isValidLink).map(link => (
                <Link
                  key={`footer-support-${link.href}`}
                  href={link.href}
                  className="text-sm transition-colors footer-link"
                  style={linkStyle}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <p className="text-xs" style={{ color: 'rgba(247,239,229,0.35)' }}>Mon–Sat · 9AM–6PM</p>
              <p className="text-xs" style={{ color: 'rgba(247,239,229,0.35)', marginTop: '0.35rem' }}>
                Online only · Philippines
              </p>
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h4 className="text-xs font-semibold uppercase mb-5" style={headingStyle}>
              Shipping
            </h4>
            <p
              className="text-xs font-semibold mb-3"
              style={{ color: 'var(--primary)' }}
            >
              Nationwide Shipping Available
            </p>
            <div className="flex flex-col" style={{ gap: '0.55rem' }}>
              {[
                'Metro Manila via Lalamove',
                'Provincial via J&T Express',
                'Fees collected once books arrive',
              ].map(item => (
                <p
                  key={item}
                  className="text-xs flex items-start"
                  style={{ color: 'rgba(247,239,229,0.55)', lineHeight: '1.55', gap: '0.65rem' }}
                >
                  <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.05rem' }} aria-hidden="true">›</span>
                  <span>{item}</span>
                </p>
              ))}
              <p
                className="text-xs"
                style={{
                  color: 'rgba(247,239,229,0.32)',
                  lineHeight: '1.55',
                  marginTop: '0.35rem',
                }}
              >
                ETA dates are tentative and subject to international shipping &amp; customs
              </p>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div
          style={{
            marginTop: '3rem',
            marginBottom: '1.5rem',
            height: '1px',
            background: 'rgba(200,164,91,0.22)',
          }}
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: '0.75rem' }}>
          <p className="text-xs" style={{ color: 'rgba(247,239,229,0.3)' }}>
            © 2026 Daddee&apos;s Shelf. All rights reserved.
          </p>
          <p
            className="text-xs font-serif italic"
            style={{ color: 'rgba(247,239,229,0.3)' }}
          >
            Made with love for Filipino readers
          </p>
        </div>
      </div>
    </footer>
  );
}
