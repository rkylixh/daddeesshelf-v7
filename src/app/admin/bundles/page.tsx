'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { Book } from '@/lib/types';

interface Bundle {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  final_srp: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  books?: Book[];
}

const EMPTY_FORM = {
  name: '', description: '', cover_url: '', final_srp: '', is_visible: true,
};

function BundleManagementContent() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [bundleBooks, setBundleBooks] = useState<string[]>([]);
  const [bookSearch, setBookSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bundleData } = await supabase.from('bundles').select('*').order('created_at', { ascending: false });
      const { data: bookData } = await supabase.from('books').select('*').eq('is_visible', true).order('title');

      const books = (bookData ?? []) as unknown as Book[];
      setAllBooks(books);

      if (bundleData && bundleData.length > 0) {
        const bundleIds = bundleData.map((b: Record<string, unknown>) => String(b.id));
        const { data: bbData } = await supabase.from('bundle_books').select('*').in('bundle_id', bundleIds);
        const bbMap: Record<string, string[]> = {};
        (bbData ?? []).forEach((bb: Record<string, unknown>) => {
          const bid = String(bb.bundle_id);
          if (!bbMap[bid]) bbMap[bid] = [];
          bbMap[bid].push(String(bb.book_id));
        });
        setBundles(bundleData.map((b: Record<string, unknown>) => ({
          id: String(b.id),
          name: String(b.name ?? ''),
          description: String(b.description ?? ''),
          cover_url: String(b.cover_url ?? ''),
          final_srp: Number(b.final_srp ?? 0),
          is_visible: b.is_visible !== false,
          created_at: String(b.created_at ?? ''),
          updated_at: String(b.updated_at ?? ''),
          books: books.filter(bk => (bbMap[String(b.id)] ?? []).includes(bk.id)),
        })));
      } else {
        setBundles([]);
      }
    } catch { setBundles([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setBundleBooks([]);
    setBookSearch('');
    setShowForm(true);
  };

  const openEdit = (bundle: Bundle) => {
    setEditId(bundle.id);
    setForm({ name: bundle.name, description: bundle.description, cover_url: bundle.cover_url, final_srp: bundle.final_srp.toString(), is_visible: bundle.is_visible });
    setBundleBooks((bundle.books ?? []).map(b => b.id));
    setBookSearch('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setMessage('Bundle name is required.'); return; }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        cover_url: form.cover_url.trim(),
        final_srp: Number(form.final_srp) || 0,
        is_visible: form.is_visible,
        updated_at: new Date().toISOString(),
      };

      let bundleId = editId;
      if (editId) {
        await supabase.from('bundles').update(payload).eq('id', editId);
        await supabase.from('bundle_books').delete().eq('bundle_id', editId);
      } else {
        const { data } = await supabase.from('bundles').insert(payload).select('id').single();
        bundleId = data?.id ?? null;
      }

      if (bundleId && bundleBooks.length > 0) {
        await supabase.from('bundle_books').insert(
          bundleBooks.map((bookId, idx) => ({ bundle_id: bundleId, book_id: bookId, sort_order: idx }))
        );
      }

      setMessage(editId ? 'Bundle updated.' : 'Bundle created.');
      setShowForm(false);
      await load();
    } catch { setMessage('Failed to save bundle.'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('bundle_books').delete().eq('bundle_id', deleteId);
    await supabase.from('bundles').delete().eq('id', deleteId);
    setDeleteId(null);
    setMessage('Bundle deleted.');
    await load();
  };

  const handleToggleVisible = async (bundle: Bundle) => {
    await supabase.from('bundles').update({ is_visible: !bundle.is_visible, updated_at: new Date().toISOString() }).eq('id', bundle.id);
    await load();
  };

  const bookSearchResults = allBooks
    .filter(b => !bundleBooks.includes(b.id))
    .filter(b => {
      if (!bookSearch.trim()) return false;
      const q = bookSearch.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.sku.toLowerCase().includes(q);
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Bundle Management</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Create and manage book bundles. Bundles will appear in the shop.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Icon name="PlusIcon" size={16} />
          New Bundle
        </button>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <Icon name="RectangleGroupIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>No bundles yet.</p>
          <button onClick={openCreate} className="btn-primary text-xs px-4 py-2 mt-3">Create First Bundle</button>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.map(bundle => (
            <div key={bundle.id} className="rounded-xl p-4 flex items-start gap-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)', opacity: bundle.is_visible ? 1 : 0.6 }}>
              <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0" style={{ background: 'var(--muted)' }}>
                <AppImage src={bundle.cover_url || '/assets/images/no_image.png'} alt={`Cover of ${bundle.name}`} width={48} height={64} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{bundle.name}</p>
                {bundle.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--foreground-muted)' }}>{bundle.description}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--primary-bright)' }}>₱{bundle.final_srp.toLocaleString()}</span>
                  <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{(bundle.books ?? []).length} books</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggleVisible(bundle)} className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={bundle.is_visible ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' } : { background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}>
                  {bundle.is_visible ? 'Visible' : 'Hidden'}
                </button>
                <button onClick={() => openEdit(bundle)} className="p-1.5 rounded-lg btn-ghost"><Icon name="PencilIcon" size={14} /></button>
                <button onClick={() => setDeleteId(bundle.id)} className="p-1.5 rounded-lg" style={{ color: '#f87171' }}><Icon name="TrashIcon" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ background: 'var(--background-card)', borderBottom: '1px solid var(--border)', zIndex: 1 }}>
              <h3 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>{editId ? 'Edit Bundle' : 'New Bundle'}</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1 rounded-lg"><Icon name="XMarkIcon" size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {message && <p className="text-xs" style={{ color: '#f87171' }}>{message}</p>}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Bundle Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field text-sm" placeholder="e.g. Fantasy Starter Pack" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field text-sm resize-none" placeholder="Bundle description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Cover Image URL</label>
                  <input type="url" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} className="input-field text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Bundle Price (₱)</label>
                  <input type="number" value={form.final_srp} onChange={e => setForm(f => ({ ...f, final_srp: e.target.value }))} className="input-field text-sm" placeholder="0" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="bundle-visible" checked={form.is_visible} onChange={e => setForm(f => ({ ...f, is_visible: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="bundle-visible" className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Visible in shop</label>
              </div>

              {/* Add books to bundle */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>Books in Bundle ({bundleBooks.length})</label>
                <div className="relative mb-2">
                  <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                  <input type="search" placeholder="Search books to add..." value={bookSearch} onChange={e => setBookSearch(e.target.value)} className="input-field pl-9 text-sm" />
                </div>
                {bookSearchResults.length > 0 && (
                  <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid var(--border)' }}>
                    {bookSearchResults.map(book => (
                      <button key={book.id} type="button" onClick={() => { setBundleBooks(prev => [...prev, book.id]); setBookSearch(''); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs"
                        style={{ borderBottom: '1px solid var(--border)', background: 'var(--background-card)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--background-card)')}>
                        <span className="flex-1 truncate font-medium" style={{ color: 'var(--foreground)' }}>{book.title}</span>
                        <span style={{ color: 'var(--foreground-subtle)' }}>{book.author}</span>
                        <span className="font-bold" style={{ color: 'var(--primary-bright)' }}>+ Add</span>
                      </button>
                    ))}
                  </div>
                )}
                {bundleBooks.length > 0 && (
                  <div className="space-y-1">
                    {bundleBooks.map(bookId => {
                      const book = allBooks.find(b => b.id === bookId);
                      if (!book) return null;
                      return (
                        <div key={bookId} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <span className="font-medium truncate flex-1" style={{ color: 'var(--foreground)' }}>{book.title}</span>
                          <button type="button" onClick={() => setBundleBooks(prev => prev.filter(id => id !== bookId))} className="ml-2 flex-shrink-0" style={{ color: '#f87171' }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editId ? 'Update Bundle' : 'Create Bundle'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
            <h3 className="font-display text-base font-bold mb-2" style={{ color: 'var(--foreground)' }}>Delete Bundle?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--foreground-muted)' }}>This will permanently delete the bundle and remove all its book associations.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 btn-ghost py-2.5 text-sm rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBundlesPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Bundle Management">
        <BundleManagementContent />
      </AdminLayout>
    </AdminGuard>
  );
}
