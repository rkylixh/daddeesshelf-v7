'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { adminHandlesMatch, normalizeAdminHandle, resolveAdminDisplayName } from '@/lib/admin-auth';
import { toast } from 'sonner';

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
  { label: 'Support Tickets', href: '/admin/support-tickets', icon: 'EnvelopeIcon', badgeKey: 'supportTickets' },
  { label: 'Title Requests', href: '/admin/requests', icon: 'DocumentTextIcon' },
  { label: 'Order Management', href: '/admin/orders', icon: 'ShoppingBagIcon', badgeKey: 'orders' },
  { label: 'Customer Management', href: '/admin/customers', icon: 'UsersIcon' },
  { label: 'Store Credits', href: '/admin/store-credits', icon: 'CreditCardIcon' },
  { label: 'Admin Users', href: '/admin/users', icon: 'UserGroupIcon' },
  { label: 'Audit Log', href: '/admin/audit', icon: 'ClipboardDocumentListIcon' },
];

type ChatMessage = {
  id: string;
  sender_handle: string;
  sender_display_name: string;
  message: string;
  created_at: string;
};

function mergeChatMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(existing.map(m => [m.id, m]));
  for (const msg of incoming) byId.set(msg.id, msg);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string | null>(null);
  const nameByHandleRef = useRef<Map<string, string>>(new Map());

  // Nav badge counts
  const [navBadges, setNavBadges] = useState<Record<string, number>>({ supportTickets: 0, orders: 0 });

  // Fetch nav badge counts
  const fetchNavBadges = async () => {
    try {
      const supabase = createClient();
      const [ticketsRes, ordersRes, pendingPayRes] = await Promise.all([
        // New support tickets
        supabase
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'New'),
        // New/Pending orders
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        // Pending payment verification orders
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending Payment Verification'),
      ]);

      const ticketCount = ticketsRes.count ?? 0;
      const orderCount = (ordersRes.count ?? 0) + (pendingPayRes.count ?? 0);

      setNavBadges({ supportTickets: ticketCount, orders: orderCount });
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchNavBadges();
    const interval = setInterval(fetchNavBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get current admin session
  const getAdminSession = () => {
    try {
      const raw = sessionStorage.getItem('admin_session');
      if (!raw) return null;
      return JSON.parse(raw) as { id: string; tiktok_handle: string; role: string; display_name?: string };
    } catch { return null; }
  };

  // Heartbeat + online count (run together so count reflects current session)
  useEffect(() => {
    const session = getAdminSession();
    if (!session) return;

    const supabase = createClient();

    const refreshPresence = async () => {
      try {
        const now = new Date().toISOString();
        const { data: existingRows } = await supabase
          .from('admin_sessions')
          .select('id')
          .eq('admin_id', session.id)
          .order('last_seen_at', { ascending: false })
          .limit(1);

        const existing = existingRows?.[0];

        if (existing) {
          await supabase
            .from('admin_sessions')
            .update({ last_seen_at: now, tiktok_handle: session.tiktok_handle })
            .eq('id', existing.id);
          sessionRef.current = existing.id;
          await supabase
            .from('admin_sessions')
            .delete()
            .eq('admin_id', session.id)
            .neq('id', existing.id);
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('admin_sessions')
            .insert({ admin_id: session.id, tiktok_handle: session.tiktok_handle, last_seen_at: now })
            .select('id')
            .single();
          if (inserted) {
            sessionRef.current = inserted.id;
          } else if (insertError) {
            // Row may already exist (unique index) — update by admin_id instead
            await supabase
              .from('admin_sessions')
              .update({ last_seen_at: now, tiktok_handle: session.tiktok_handle })
              .eq('admin_id', session.id);
          }
        }

        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { data: sessions } = await supabase
          .from('admin_sessions')
          .select('admin_id')
          .gte('last_seen_at', twoMinAgo)
          .not('admin_id', 'is', null);

        const unique = new Set(
          (sessions ?? []).map(s => s.admin_id).filter(Boolean),
        );
        // If heartbeat succeeded but query hasn't caught up, count yourself as online
        setOnlineCount(Math.max(unique.size, sessionRef.current ? 1 : 0));
      } catch { /* ignore */ }
    };

    refreshPresence();
    const interval = setInterval(refreshPresence, 30000);

    return () => {
      clearInterval(interval);
      if (sessionRef.current) {
        supabase.from('admin_sessions').delete().eq('id', sessionRef.current).then(() => {});
      }
    };
  }, []);

  // Load chat messages (fetch + poll + realtime)
  useEffect(() => {
    if (!chatOpen) return;
    const supabase = createClient();

    const fetchMessages = async (showLoading = false) => {
      if (showLoading) setChatLoading(true);
      try {
        const [msgResult, adminResult] = await Promise.all([
          supabase
            .from('admin_messages')
            .select('id, sender_handle, sender_display_name, message, created_at')
            .order('created_at', { ascending: true })
            .limit(100),
          supabase
            .from('admin_users')
            .select('tiktok_handle, display_name'),
        ]);

        const { data: messages, error: msgError } = msgResult;
        const { data: admins, error: adminError } = adminResult;

        if (msgError) {
          toast.error(`Could not load chat: ${msgError.message}`);
          return;
        }
        if (adminError) {
          toast.error(`Could not load admin names: ${adminError.message}`);
        }

        const nameByHandle = new Map(
          (admins ?? []).map(a => [
            normalizeAdminHandle(a.tiktok_handle),
            a.display_name?.trim() || a.tiktok_handle,
          ]),
        );
        nameByHandleRef.current = nameByHandle;

        const resolved = (messages ?? []).map(m => ({
          ...m,
          sender_display_name: resolveAdminDisplayName(m, nameByHandle),
        }));
        setChatMessages(prev => mergeChatMessages(prev, resolved));
      } catch {
        toast.error('Could not load chat messages.');
      } finally {
        if (showLoading) setChatLoading(false);
      }
    };

    fetchMessages(true);
    const pollInterval = setInterval(() => fetchMessages(false), 5000);

    const channel = supabase
      .channel('admin_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, payload => {
        const incoming = payload.new as ChatMessage;
        setChatMessages(prev => mergeChatMessages(prev, [{
          ...incoming,
          sender_display_name: resolveAdminDisplayName(incoming, nameByHandleRef.current),
        }]));
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [chatOpen]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatSending) return;
    const session = getAdminSession();
    if (!session) {
      toast.error('Admin session expired. Please sign in again.');
      return;
    }
    setChatSending(true);
    try {
      const supabase = createClient();
      let displayName = session.display_name?.trim() || '';
      if (!displayName) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('display_name')
          .eq('id', session.id)
          .maybeSingle();
        displayName = adminUser?.display_name?.trim() || session.tiktok_handle;
      }

      const { data: inserted, error } = await supabase
        .from('admin_messages')
        .insert({
          sender_handle: session.tiktok_handle,
          sender_display_name: displayName,
          message: msg,
        })
        .select('id, sender_handle, sender_display_name, message, created_at')
        .single();

      if (error) {
        toast.error(`Failed to send message: ${error.message}`);
        return;
      }

      setChatInput('');
      setChatMessages(prev => mergeChatMessages(prev, [{
        ...inserted,
        sender_display_name: resolveAdminDisplayName(inserted, nameByHandleRef.current),
      }]));
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setChatSending(false);
    }
  };

  const handleSignOut = async () => {
    const session = getAdminSession();
    const supabase = createClient();
    // Remove all session rows for this admin
    if (session?.id) {
      await supabase.from('admin_sessions').delete().eq('admin_id', session.id);
    } else if (sessionRef.current) {
      await supabase.from('admin_sessions').delete().eq('id', sessionRef.current);
    }
    sessionStorage.removeItem('admin_session');
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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar — always fixed so page scroll never moves it */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
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
              <span className="flex-1">{item.label}</span>
              {item.badgeKey && navBadges[item.badgeKey] > 0 && (
                <span
                  className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
                  style={{
                    background: '#ef4444',
                    minWidth: '18px',
                    height: '18px',
                    fontSize: '10px',
                    padding: '0 4px',
                    lineHeight: '18px',
                  }}
                >
                  {navBadges[item.badgeKey] > 99 ? '99+' : navBadges[item.badgeKey]}
                </span>
              )}
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

      {/* Main content — offset for fixed sidebar; only this column scrolls */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden lg:ml-64">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-5 h-14 flex-shrink-0 z-20"
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

        {/* Page content — sole scroll region */}
        <main className="flex-1 min-h-0 overflow-y-auto p-5">
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
              {chatLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mb-2" style={{ borderColor: 'var(--primary)' }} />
                  <p className="text-xs" style={{ color: 'rgba(245,230,200,0.4)' }}>Loading messages...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Icon name="ChatBubbleLeftRightIcon" size={32} style={{ color: 'rgba(200,164,91,0.3)' } as React.CSSProperties} />
                  <p className="text-xs mt-2" style={{ color: 'rgba(245,230,200,0.4)' }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = adminHandlesMatch(currentAdmin?.tiktok_handle ?? '', msg.sender_handle);
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[80%] rounded-xl px-3 py-2"
                        style={{
                          background: isMe ? 'rgba(200,164,91,0.25)' : 'rgba(245,230,200,0.08)',
                          border: `1px solid ${isMe ? 'rgba(200,164,91,0.4)' : 'rgba(245,230,200,0.12)'}`,
                        }}
                      >
                        <p className="text-xs font-semibold mb-0.5" style={{ color: isMe ? '#E8D5A8' : '#C8A45B' }}>
                          {isMe ? 'You' : (msg.sender_display_name || msg.sender_handle || 'Admin')}
                        </p>
                        <p className="text-sm" style={{ color: '#FFF8F0', wordBreak: 'break-word' }}>{msg.message}</p>
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
