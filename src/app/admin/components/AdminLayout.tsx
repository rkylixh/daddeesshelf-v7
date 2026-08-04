'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const ADMIN_NAV = [
  { label: 'Inventory Control', href: '/admin/inventory', icon: 'ArchiveBoxIcon' },
  { label: 'Book Detail Management', href: '/admin/book-detail', icon: 'BookOpenIcon' },
  { label: 'Bundle Management', href: '/admin/bundles', icon: 'RectangleGroupIcon' },
  { label: 'Genre Management', href: '/admin/genres', icon: 'TagIcon' },
  { label: 'Featured Books', href: '/admin/featured', icon: 'StarIcon' },
  { label: 'Fresh Picks', href: '/admin/fresh-picks', icon: 'SparklesIcon' },
  { label: 'BookTok Favorites', href: '/admin/booktok', icon: 'HeartIcon' },
  { label: 'Homepage Content', href: '/admin/homepage', icon: 'HomeIcon' },
  { label: 'FAQ Management', href: '/admin/faqs', icon: 'QuestionMarkCircleIcon' },
  { label: 'Support Tickets', href: '/admin/support-tickets', icon: 'EnvelopeIcon' },
  { label: 'Title Requests', href: '/admin/requests', icon: 'DocumentTextIcon' },
  { label: 'Preorder Management', href: '/admin/preorders', icon: 'ClockIcon' },
  { label: 'Order Management', href: '/admin/orders', icon: 'ShoppingBagIcon' },
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
        style={{ background: 'rgba(10,10,15,0.98)', borderRight: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <AppLogo size={26} />
          <div>
            <p className="font-display text-sm font-semibold" style={{ color: 'var(--primary-bright)' }}>Daddee&apos;s Shelf</p>
            <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {ADMIN_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${pathname === item.href ? 'active' : 'nav-link'}`}
              style={pathname === item.href ? { background: 'var(--primary-glow)', color: 'var(--primary-bright)' } : {}}
            >
              <Icon name={item.icon as 'HomeIcon'} size={16} style={{ color: pathname === item.href ? 'var(--primary-bright)' : 'var(--foreground-subtle)' } as React.CSSProperties} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs nav-link mb-1">
            <Icon name="ArrowLeftIcon" size={14} />
            Back to Site
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs nav-link w-full text-left"
            style={{ color: '#f87171' }}
          >
            <Icon name="ArrowRightOnRectangleIcon" size={14} style={{ color: '#f87171' } as React.CSSProperties} />
            Sign Out
          </button>
        </div>
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
          style={{ background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-ghost p-2 rounded-lg lg:hidden"
            >
              <Icon name="Bars3Icon" size={18} />
            </button>
            <h1 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>{title}</h1>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            Admin
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
