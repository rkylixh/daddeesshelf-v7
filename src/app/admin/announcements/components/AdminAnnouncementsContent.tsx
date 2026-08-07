'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const TYPE_OPTIONS = [
  { value: 'info', label: 'Info', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
  { value: 'warning', label: 'Warning', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  { value: 'success', label: 'Success', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
  { value: 'promo', label: 'Promo', color: '#C8A45B', bg: 'rgba(200,164,91,0.12)', border: 'rgba(200,164,91,0.35)' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
];

function getTypeStyle(type: string) {
  return TYPE_OPTIONS.find(t => t.value === type) ?? TYPE_OPTIONS[0];
}

function getAdminHandle(): string {
  try {
    const raw = sessionStorage.getItem('admin_session');
    if (!raw) return 'admin';
    return JSON.parse(raw).tiktok_handle ?? 'admin';
  } catch { return 'admin'; }
}

const EMPTY_FORM = { title: '', message: '', type: 'info', is_active: true, starts_at: '', ends_at: '' };

export default function AdminAnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (a: Announcement) => {
    setEditId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      type: a.type,
      is_active: a.is_active,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : '',
      ends_at: a.ends_at ? a.ends_at.slice(0, 16) : '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { setError('Title and message are required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        is_active: form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        created_by: getAdminHandle(),
        updated_at: new Date().toISOString(),
      };
      if (editId) {
        await supabase.from('announcements').update(payload).eq('id', editId);
      } else {
        await supabase.from('announcements').insert(payload);
      }
      setShowForm(false);
      fetchAnnouncements();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (a: Announcement) => {
    await supabase.from('announcements').update({ is_active: !a.is_active, updated_at: new Date().toISOString() }).eq('id', a.id);
    fetchAnnouncements();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('announcements').delete().eq('id', deleteId);
    setDeleteId(null);
    setDeleting(false);
    fetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Announcements</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Manage banners and announcements shown to customers.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Icon name="PlusIcon" size={16} />
          New Announcement
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <Icon name="MegaphoneIcon" size={40} style={{ color: 'var(--foreground-subtle)', margin: '0 auto 12px' } as React.CSSProperties} />
          <p className="font-display text-base font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>No announcements yet</p>
          <p className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>Create your first announcement to display banners to customers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const ts = getTypeStyle(a.type);
            return (
              <div
                key={a.id}
                className="rounded-xl p-4 flex items-start gap-4"
                style={{ background: 'var(--background-card)', border: `1px solid ${a.is_active ? ts.border : 'var(--border)'}`, opacity: a.is_active ? 1 : 0.6 }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}
                  >
                    {ts.label}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.title}</p>
                    {!a.is_active && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--foreground-subtle)' }}>Inactive</span>
                    )}
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--foreground-muted)', lineHeight: '1.6' }}>{a.message}</p>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                    {a.starts_at && <span>Starts: {new Date(a.starts_at).toLocaleDateString('en-PH')}</span>}
                    {a.ends_at && <span>Ends: {new Date(a.ends_at).toLocaleDateString('en-PH')}</span>}
                    <span>By: {a.created_by}</span>
                    <span>{new Date(a.created_at).toLocaleDateString('en-PH')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(a)}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                    style={a.is_active
                      ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                      : { background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }
                    }
                  >
                    {a.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg btn-ghost">
                    <Icon name="PencilIcon" size={14} />
                  </button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg" style={{ color: '#f87171' }}>
                    <Icon name="TrashIcon" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>
                {editId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1 rounded-lg">
                <Icon name="XMarkIcon" size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="e.g. New Batch Arriving Soon!"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Message *</label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="input-field text-sm resize-none"
                  placeholder="Announcement details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="input-field text-sm"
                  >
                    {TYPE_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Active</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Ends At (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
              </div>
              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 text-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
            <h3 className="font-display text-base font-bold mb-2" style={{ color: 'var(--foreground)' }}>Delete Announcement?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
