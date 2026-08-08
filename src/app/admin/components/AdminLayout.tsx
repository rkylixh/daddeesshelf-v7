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
  { label: 'On Hand Inventory', href: '/admin/on-hand', icon: 'CubeIcon' },
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
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender_handle: string; sender_display_name: string; message: string; created_at: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string | null>(null);

  // Get current admin session
  const getAdminSession = () => {
    try {
      const raw = sessionStorage.getItem('admin_session');
      if (!raw) return null;
      return JSON.parse(raw) as { id: string; tiktok_handle: string; role: string };
    } catch { return null; }
  };

  // Heartbeat: upsert admin session every 30s
  useEffect(() => {
    const session = getAdminSession();
    if (!session) return;

    const supabase = createClient();

    const upsertSession = async () => {
      try {
        // Check if session row exists for this admin
        const { data: existing } = await supabase
          .from('admin_sessions')
          .select('id')
          .eq('admin_id', session.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('admin_sessions')
            .update({ last_seen_at: new Date().toISOString(), tiktok_handle: session.tiktok_handle })
            .eq('admin_id', session.id);
          sessionRef.current = existing.id;
        } else {
          const { data: inserted } = await supabase
            .from('admin_sessions')
            .insert({ admin_id: session.id, tiktok_handle: session.tiktok_handle })
            .select('id')
            .single();
          if (inserted) sessionRef.current = inserted.id;
        }
      } catch { /* ignore */ }
    };

    upsertSession();
    const interval = setInterval(upsertSession, 30000);

    // Cleanup: remove session on unmount
    return () => {
      clearInterval(interval);
      if (sessionRef.current) {
        supabase.from('admin_sessions').delete().eq('id', sessionRef.current).then(() => {});
      }
    };
  }, []);

  // Poll online count (admins seen in last 2 minutes)
  useEffect(() => {
    const supabase = createClient();
    const fetchOnline = async () => {
      try {
        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('admin_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen_at', twoMinAgo);
        setOnlineCount(count ?? 0);
      } catch { /* ignore */ }
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load chat messages
  useEffect(() => {
    if (!chatOpen) return;
    const supabase = createClient();
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setChatMessages(data);
    };
    fetchMessages();
    // Realtime subscription
    const channel = supabase
      .channel('admin_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, payload => {
        setChatMessages(prev => [...prev, payload.new as typeof chatMessages[0]]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatOpen]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatSending) return;
    const session = getAdminSession();
    if (!session) return;
    setChatSending(true);
    try {
      const supabase = createClient();
      await supabase.from('admin_messages').insert({
        sender_handle: session.tiktok_handle,
        sender_display_name: session.tiktok_handle,
        message: msg,
      });
      setChatInput('');
    } catch { /* ignore */ } finally {
      setChatSending(false);
    }
  };

  const handleSignOut = async () => {
    // Remove session on sign out
    if (sessionRef.current) {
      const supabase = createClient();
      await supabase.from('admin_sessions').delete().eq('id', sessionRef.current);
    }
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

  const currentAdmin = getAdminSession();

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

        {/* Online indicator */}
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(200,164,91,0.1)', background: 'rgba(200,164,91,0.04)' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span className="text-xs" style={{ color: 'rgba(245,230,200,0.7)' }}>
            {onlineCount} admin{onlineCount !== 1 ? 's' : ''} online
          </span>
          <button
            onClick={() => setChatOpen(true)}
            className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all"
            style={{ background: 'rgba(200,164,91,0.15)', color: 'var(--primary)', border: '1px solid rgba(200,164,91,0.3)' }}
          >
            <Icon name="ChatBubbleLeftRightIcon" size={12} />
            Chat
          </button>
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

          <div className="flex items-center gap-3">
            {/* Online badge in header */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
              {onlineCount} online
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
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>

      {/* Admin Chat Panel */}
      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-sm rounded-2xl flex flex-col overflow-hidden"
            style={{ background: '#2C1A0E', border: '1px solid rgba(200,164,91,0.35)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)', height: '480px' }}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(200,164,91,0.2)', background: 'rgba(200,164,91,0.06)' }}>
              <div className="flex items-center gap-2">
                <Icon name="ChatBubbleLeftRightIcon" size={16} style={{ color: 'var(--primary)' } as React.CSSProperties} />
                <span className="font-display text-sm font-bold" style={{ color: '#F0DFC4' }}>Admin Chat</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  {onlineCount} online
                </span>
              </div>
              <button onClick={() => setChatOpen(false)} className="btn-ghost p-1 rounded-lg" style={{ color: '#C8A45B' }}>
                <Icon name="XMarkIcon" size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Icon name="ChatBubbleLeftRightIcon" size={32} style={{ color: 'rgba(200,164,91,0.3)' } as React.CSSProperties} />
                  <p className="text-xs mt-2" style={{ color: 'rgba(245,230,200,0.4)' }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = currentAdmin?.tiktok_handle === msg.sender_handle;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[80%] rounded-xl px-3 py-2"
                        style={{
                          background: isMe ? 'rgba(200,164,91,0.25)' : 'rgba(245,230,200,0.08)',
                          border: `1px solid ${isMe ? 'rgba(200,164,91,0.4)' : 'rgba(245,230,200,0.12)'}`,
                        }}
                      >
                        {!isMe && (
                          <p className="text-xs font-semibold mb-0.5" style={{ color: '#C8A45B' }}>{msg.sender_handle}</p>
                        )}
                        <p className="text-xs" style={{ color: '#F0DFC4', wordBreak: 'break-word' }}>{msg.message}</p>
                        <p className="text-xs mt-0.5 text-right" style={{ color: 'rgba(245,230,200,0.35)', fontSize: '10px' }}>
                          {new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(200,164,91,0.2)' }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                style={{ background: 'rgba(245,230,200,0.07)', border: '1px solid rgba(200,164,91,0.25)', color: '#F0DFC4' }}
              />
              <button
                onClick={sendMessage}
                disabled={chatSending || !chatInput.trim()}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: chatInput.trim() ? 'rgba(200,164,91,0.25)' : 'rgba(200,164,91,0.08)',
                  color: chatInput.trim() ? 'var(--primary)' : 'rgba(200,164,91,0.3)',
                  border: '1px solid rgba(200,164,91,0.3)',
                }}
              >
                <Icon name="PaperAirplaneIcon" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
