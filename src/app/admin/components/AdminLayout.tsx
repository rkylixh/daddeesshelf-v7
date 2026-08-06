'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const ADMIN_NAV = [
  { label: 'Inventory Control', href: '/admin/inventory', icon: 'ArchiveBoxIcon' },
  { label: 'Book Detail Management', href: '/admin/book-detail', icon: 'BookOpenIcon' },
  { label: 'Visibility Control', href: '/admin/visibility', icon: 'EyeIcon' },
  { label: 'Bundle Management', href: '/admin/bundles', icon: 'RectangleGroupIcon' },
  { label: 'Genre Management', href: '/admin/genres', icon: 'TagIcon' },
  { label: 'Featured Books', href: '/admin/featured', icon: 'StarIcon' },
  { label: 'Fresh Picks', href: '/admin/fresh-picks', icon: 'SparklesIcon' },
  { label: 'BookTok Favorites', href: '/admin/booktok', icon: 'HeartIcon' },
  { label: 'Homepage Content', href: '/admin/homepage', icon: 'HomeIcon' },
  { label: 'FAQ Management', href: '/admin/faqs', icon: 'QuestionMarkCircleIcon' },
  { label: 'Support Tickets', href: '/admin/support-tickets', icon: 'EnvelopeIcon' },
  { label: 'Title Requests', href: '/admin/requests', icon: 'DocumentTextIcon' },
  { label: 'Order Management', href: '/admin/orders', icon: 'ShoppingBagIcon' },
  { label: 'Customer Management', href: '/admin/customers', icon: 'UsersIcon' },
  { label: 'Store Credits', href: '/admin/store-credits', icon: 'CreditCardIcon' },
  { label: 'Admin Users', href: '/admin/users', icon: 'UserGroupIcon' },
  { label: 'Audit Log', href: '/admin/audit', icon: 'ClipboardDocumentListIcon' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false);
      }
    };
    if (adminMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [adminMenuOpen]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
        style={{ background: '#2C1A0E', borderRight: '1px solid rgba(200,164,91,0.2)', backdropFilter: 'blur(12px)' }}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0" style={{ borderBottom: '1px solid rgba(200,164,91,0.15)' }}>
          <img
            src="/assets/images/Untitled_design__7_-1785917477724.png"
            alt="Daddee's Shelf logo"
            width={28}
            height={28}
            style={{ objectFit: 'contain' }}
          />
          <div>
            <p className="font-display text-sm font-semibold" style={{ color: 'var(--primary)' }}>Daddee&apos;s Shelf</p>
            <p className="text-xs" style={{ color: 'rgba(200,164,91,0.5)' }}>Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {ADMIN_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all`}
              style={pathname === item.href
                ? { background: 'var(--primary-glow)', color: 'var(--primary-bright)' }
                : { color: 'rgba(245,230,200,0.7)' }
              }
            >
              <Icon name={item.icon as 'HomeIcon'} size={16} style={{ color: pathname === item.href ? 'var(--primary-bright)' : 'rgba(245,230,200,0.5)' } as React.CSSProperties} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-5 h-14 flex-shrink-0 sticky top-0 z-20"
          style={{ background: 'rgba(44,26,14,0.97)', borderBottom: '1px solid rgba(200,164,91,0.15)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-ghost p-2 rounded-lg lg:hidden"
            >
              <Icon name="Bars3Icon" size={18} />
            </button>
            <h1 className="font-display text-base font-bold" style={{ color: '#F5E6C8' }}>{title}</h1>
          </div>

          {/* Admin dropdown button */}
          <div ref={adminMenuRef} className="relative">
            <button
              onClick={() => setAdminMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold transition-all duration-200"
              style={{
                background: adminMenuOpen ? 'rgba(200,164,91,0.25)' : 'rgba(200,164,91,0.15)',
                color: 'var(--primary)',
                border: '1px solid rgba(200,164,91,0.3)',
              }}
            >
              Admin
              <Icon
                name="ChevronDownIcon"
                size={12}
                style={{ color: 'var(--primary)', transform: adminMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' } as React.CSSProperties}
              />
            </button>

            {/* Dropdown menu */}
            {adminMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden shadow-xl"
                style={{
                  background: '#2C1A0E',
                  border: '1px solid rgba(200,164,91,0.25)',
                  zIndex: 50,
                }}
              >
                <Link
                  href="/"
                  onClick={() => setAdminMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-xs transition-all duration-150 nav-link"
                >
                  <Icon name="ArrowLeftIcon" size={14} />
                  Back to Site
                </Link>
                <div style={{ height: '1px', background: 'rgba(200,164,91,0.12)' }} />
                <button
                  onClick={() => { setAdminMenuOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2.5 px-4 py-3 text-xs w-full text-left transition-all duration-150 nav-link"
                  style={{ color: '#f87171' }}
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={14} style={{ color: '#f87171' } as React.CSSProperties} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
