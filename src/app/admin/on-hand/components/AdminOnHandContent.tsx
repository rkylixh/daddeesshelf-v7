'use client';

import React, { useState, useEffect, useCallback } from 'react';

import AppImage from '@/components/ui/AppImage';

import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { OnHandItem } from '@/lib/types';

function mapOnHandRow(row: Record<string, unknown>): OnHandItem {
  return {
    id: String(row.id ?? ''),
    sku: String(row.sku ?? ''),
    title: String(row.title ?? ''),
    author: String(row.author ?? ''),
    genre: String(row.genre ?? ''),
    subgenre: String(row.subgenre ?? ''),
    series: String(row.series ?? ''),
    series_order: row.series_order != null ? Number(row.series_order) : null,
    format: (row.format as OnHandItem['format']) ?? 'Paperback',
    edition: String(row.edition ?? ''),
    final_srp: Number(row.final_srp ?? 0),
    inventory: Number(row.inventory ?? 0),
    synopsis: String(row.synopsis ?? ''),
    cover_url: String(row.cover_url ?? ''),
    goodreads_url: row.goodreads_url ? String(row.goodreads_url) : undefined,
    goodreads_score: row.goodreads_score != null ? Number(row.goodreads_score) : undefined,
    spice_level: row.spice_level != null ? Number(row.spice_level) : 0,
    gore_level: row.gore_level != null ? Number(row.gore_level) : 0,
    is_visible: row.is_visible !== false,
    is_price_visible: row.is_price_visible !== false,
    notes: String(row.notes ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

const FORMATS = ['Paperback', 'Hardcover', 'Special Edition', 'Omnibus', 'Bundle'];
const GENRES = ['Fantasy', 'Romance', 'Thriller', 'Mystery', 'Horror', 'Literary Fiction', 'Historical Fiction', 'Science Fiction', 'Classics', 'Fiction', 'Mythology', 'Nonfiction', 'Business', 'Religion'];

const EMPTY_FORM = {
  sku: '', title: '', author: '', genre: '', subgenre: '', series: '', series_order: '',
  format: 'Paperback', edition: '', final_srp: '', inventory: '1', synopsis: '',
  cover_url: '', goodreads_url: '', goodreads_score: '', spice_level: '', gore_level: '',
  is_visible: true, is_price_visible: true, notes: '',
};

export default function AdminOnHandContent() {
  const [items, setItems] = useState<OnHandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('on_hand_items').select('*').order('created_at', { ascending: false });
    setItems((data ?? []).map(mapOnHandRow));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: OnHandItem) => {
    setEditId(item.id);
    setForm({
      sku: item.sku,
      title: item.title,
      author: item.author,
      genre: item.genre,
      subgenre: item.subgenre,
      series: item.series,
      series_order: item.series_order?.toString() ?? '',
      format: item.format,
      edition: item.edition,
      final_srp: item.final_srp.toString(),
      inventory: item.inventory.toString(),
      synopsis: item.synopsis,
      cover_url: item.cover_url,
      goodreads_url: item.goodreads_url ?? '',
      goodreads_score: item.goodreads_score?.toString() ?? '',
      spice_level: item.spice_level?.toString() ?? '',
      gore_level: item.gore_level?.toString() ?? '',
      is_visible: item.is_visible,
      is_price_visible: item.is_price_visible,
      notes: item.notes,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.title.trim()) { setMessage('SKU and Title are required.'); return; }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        sku: form.sku.trim(),
        title: form.title.trim(),
        author: form.author.trim(),
        genre: form.genre,
        subgenre: form.subgenre,
        series: form.series,
        series_order: form.series_order ? Number(form.series_order) : null,
        format: form.format,
        edition: form.edition,
        final_srp: Number(form.final_srp) || 0,
        inventory: Number(form.inventory) || 0,
        synopsis: form.synopsis,
        cover_url: form.cover_url,
        goodreads_url: form.goodreads_url,
        goodreads_score: form.goodreads_score ? Number(form.goodreads_score) : null,
        spice_level: form.spice_level ? Number(form.spice_level) : 0,
        gore_level: form.gore_level ? Number(form.gore_level) : 0,
        is_visible: form.is_visible,
        is_price_visible: form.is_price_visible,
        notes: form.notes,
        updated_at: new Date().toISOString(),
      };
      if (editId) {
        await supabase.from('on_hand_items').update(payload).eq('id', editId);
        setMessage('Item updated successfully.');
      } else {
        await supabase.from('on_hand_items').insert(payload);
        setMessage('Item added successfully.');
      }
      setShowForm(false);
      await load();
    } catch {
      setMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('on_hand_items').delete().eq('id', deleteId);
    setDeleteId(null);
    setMessage('Item deleted.');
    await load();
  };

  const handleToggleVisible = async (item: OnHandItem) => {
    await supabase.from('on_hand_items').update({ is_visible: !item.is_visible, updated_at: new Date().toISOString() }).eq('id', item.id);
    await load();
  };

  const filtered = items.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.author.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
  });

  const inputClass = 'input-field text-sm py-2';
  const labelClass = 'block text-xs font-medium mb-1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>On Hand Inventory</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Manage titles currently in stock and ready to ship.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Icon name="PlusIcon" size={16} />
          Add Item
        </button>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
          {message}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
        <input
          type="search"
          placeholder="Search by title, author, or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 text-sm"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}>
          {items.length} total items
        </span>
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
          {items.filter(i => i.is_visible).length} visible
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <Icon name="ArchiveBoxIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>
            {search ? 'No items match your search.' : 'No on-hand items yet.'}
          </p>
          {!search && (
            <button onClick={openCreate} className="btn-primary text-xs px-4 py-2 mt-3">Add First Item</button>
          )}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Visible</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      background: idx % 2 === 0 ? 'var(--background-card)' : 'rgba(139,92,246,0.02)',
                      borderBottom: '1px solid var(--border)',
                      opacity: item.is_visible ? 1 : 0.6,
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-11 rounded overflow-hidden flex-shrink-0" style={{ background: 'var(--muted)' }}>
                          <AppImage src={item.cover_url || '/assets/images/no_image.png'} alt={`Cover of ${item.title}`} width={32} height={44} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate max-w-[180px]" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{item.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>{item.sku}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--primary-bright)' }}>
                      {item.is_price_visible ? `₱${item.final_srp.toLocaleString()}` : 'Hidden'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: item.inventory > 0 ? '#10b981' : '#f87171' }}>
                      {item.inventory} pcs
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVisible(item)}
                        className="text-xs px-2 py-1 rounded-lg font-semibold"
                        style={item.is_visible
                          ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                          : { background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }
                        }
                      >
                        {item.is_visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg btn-ghost" title="Edit">
                          <Icon name="PencilIcon" size={14} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg" style={{ color: '#f87171' }} title="Delete">
                          <Icon name="TrashIcon" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ background: 'var(--background-card)', borderBottom: '1px solid var(--border)', zIndex: 1 }}>
              <h3 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>
                {editId ? 'Edit On-Hand Item' : 'Add On-Hand Item'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1 rounded-lg">
                <Icon name="XMarkIcon" size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {message && <p className="text-xs" style={{ color: '#f87171' }}>{message}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Cover Image URL</label>
                  <input type="url" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>SKU *</label>
                  <input type="text" required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className={inputClass} placeholder="DS-OH-001" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Format</label>
                  <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} className="select-field text-sm py-2 w-full">
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} placeholder="Book title" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Author *</label>
                  <input type="text" required value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className={inputClass} placeholder="Author name" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Genre</label>
                  <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} className="select-field text-sm py-2 w-full">
                    <option value="">Select genre</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Subgenre</label>
                  <input type="text" value={form.subgenre} onChange={e => setForm(f => ({ ...f, subgenre: e.target.value }))} className={inputClass} placeholder="e.g. Romantasy" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Series</label>
                  <input type="text" value={form.series} onChange={e => setForm(f => ({ ...f, series: e.target.value }))} className={inputClass} placeholder="Series name" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Series Order</label>
                  <input type="number" value={form.series_order} onChange={e => setForm(f => ({ ...f, series_order: e.target.value }))} className={inputClass} placeholder="1" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Price (₱)</label>
                  <input type="number" value={form.final_srp} onChange={e => setForm(f => ({ ...f, final_srp: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Stock Quantity</label>
                  <input type="number" value={form.inventory} onChange={e => setForm(f => ({ ...f, inventory: e.target.value }))} className={inputClass} placeholder="1" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Spice Level (0–5)</label>
                  <input type="number" min="0" max="5" step="0.5" value={form.spice_level} onChange={e => setForm(f => ({ ...f, spice_level: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Gore / Intensity Level (0–5)</label>
                  <input type="number" min="0" max="5" value={form.gore_level} onChange={e => setForm(f => ({ ...f, gore_level: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Goodreads URL</label>
                  <input type="url" value={form.goodreads_url} onChange={e => setForm(f => ({ ...f, goodreads_url: e.target.value }))} className={inputClass} placeholder="https://goodreads.com/..." />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Goodreads Score</label>
                  <input type="number" min="0" max="5" step="0.01" value={form.goodreads_score} onChange={e => setForm(f => ({ ...f, goodreads_score: e.target.value }))} className={inputClass} placeholder="4.20" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Synopsis</label>
                  <textarea rows={3} value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} className="input-field text-sm resize-none" placeholder="Book description..." />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>Admin Notes</label>
                  <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputClass} placeholder="Internal notes..." />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="oh-visible" checked={form.is_visible} onChange={e => setForm(f => ({ ...f, is_visible: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="oh-visible" className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Visible on public page</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="oh-price-visible" checked={form.is_price_visible} onChange={e => setForm(f => ({ ...f, is_price_visible: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="oh-price-visible" className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Show price publicly</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editId ? 'Update Item' : 'Add Item'}
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
            <h3 className="font-display text-base font-bold mb-2" style={{ color: 'var(--foreground)' }}>Delete Item?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--foreground-muted)' }}>This action cannot be undone.</p>
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
