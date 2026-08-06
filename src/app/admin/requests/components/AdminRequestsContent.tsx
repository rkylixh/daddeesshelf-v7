'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLog';

interface TitleRequest {
  id: string;
  ref_number: string;
  customer_name: string;
  tiktok_handle: string;
  requested_title: string;
  requested_author: string;
  notes: string;
  status: string;
  admin_notes: string;
  owner_notes: string;
  is_reviewed: boolean;
  created_at: string;
}

const STATUS_OPTIONS = ['Pending', 'Noted', 'Added to Batch', 'Declined'];

function getAdminSession() {
  try {
    const raw = sessionStorage.getItem('admin_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isOwner() {
  const session = getAdminSession();
  return session?.role === 'Owner' || session?.role === 'Developer';
}

export default function AdminRequestsContent() {
  const [requests, setRequests] = useState<TitleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const ownerAccess = isOwner();

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase.from('title_requests').select('*').order('created_at', { ascending: false });
    setRequests((data ?? []) as TitleRequest[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const req = requests.find(r => r.id === id);
    await supabase.from('title_requests').update({ status, is_reviewed: true }).eq('id', id);
    loadRequests();
    toast.success('Status updated');
    await logAudit({
      action: 'REQUEST_STATUS_UPDATED',
      module: 'Title Requests',
      target_ref: req?.requested_title ?? id,
      prev_value: req?.status ?? '',
      new_value: status,
      explanation: `Admin updated status of title request "${req?.requested_title ?? id}" (${req?.tiktok_handle ?? ''}) to "${status}"`,
    });
  };

  const updateNotes = async (id: string, notes: string) => {
    const req = requests.find(r => r.id === id);
    await supabase.from('title_requests').update({ admin_notes: notes }).eq('id', id);
    toast.success('Notes saved');
    await logAudit({
      action: 'REQUEST_NOTES_UPDATED',
      module: 'Title Requests',
      target_ref: req?.requested_title ?? id,
      prev_value: req?.admin_notes ?? '',
      new_value: notes,
      explanation: `Admin updated notes for title request "${req?.requested_title ?? id}"`,
    });
  };

  const updateOwnerNotes = async (id: string, notes: string) => {
    const req = requests.find(r => r.id === id);
    await supabase.from('title_requests').update({ owner_notes: notes }).eq('id', id);
    toast.success('Owner notes saved');
    await logAudit({
      action: 'REQUEST_OWNER_NOTES_UPDATED',
      module: 'Title Requests',
      target_ref: req?.requested_title ?? id,
      prev_value: req?.owner_notes ?? '',
      new_value: notes,
      explanation: `Owner updated owner notes for title request "${req?.requested_title ?? id}"`,
    });
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = requests.filter(r =>
    !search ||
    r.requested_title.toLowerCase().includes(search.toLowerCase()) ||
    r.tiktok_handle.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_COLORS: Record<string, string> = {
    'Pending': '#f59e0b',
    'Noted': '#3b82f6',
    'Added to Batch': '#10b981',
    'Declined': '#6b7280',
  };

  return (
    <AdminLayout title="Title Requests">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          {requests.filter(r => !r.is_reviewed).length} unreviewed · {requests.length} total
        </p>
        <input
          type="search"
          placeholder="Search requests..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field text-sm py-2 w-64"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--foreground-muted)' }}>No requests found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const notesOpen = expandedNotes.has(req.id);
            return (
              <div
                key={req.id}
                className="rounded-xl p-5"
                style={{ background: 'var(--background-card)', border: `1px solid ${req.is_reviewed ? 'var(--border)' : 'rgba(139,92,246,0.3)'}` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{req.requested_title}</p>
                    {req.requested_author && <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>by {req.requested_author}</p>}
                    <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                      {req.customer_name} · {req.tiktok_handle} · {new Date(req.created_at).toLocaleDateString('en-PH')}
                    </p>
                  </div>
                  <select
                    value={req.status}
                    onChange={e => updateStatus(req.id, e.target.value)}
                    className="select-field text-xs py-1.5 px-2"
                    style={{ color: STATUS_COLORS[req.status] ?? 'var(--foreground)' }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {req.notes && (
                  <p className="text-xs mb-3 p-2 rounded-lg" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)' }}>
                    Customer note: {req.notes}
                  </p>
                )}

                {/* Owner notes display */}
                {req.owner_notes && !notesOpen && (
                  <p className="text-xs mb-3 p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--foreground-muted)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <span className="font-semibold" style={{ color: '#8b5cf6' }}>Owner note: </span>{req.owner_notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 items-start">
                  <input
                    type="text"
                    defaultValue={req.admin_notes}
                    placeholder="Admin notes..."
                    className="input-field text-xs py-1.5 flex-1 min-w-[160px]"
                    onBlur={e => updateNotes(req.id, e.target.value)}
                  />
                  <button
                    onClick={() => toggleNotes(req.id)}
                    className="text-xs px-3 py-1.5 rounded-lg whitespace-nowrap"
                    style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
                  >
                    {notesOpen ? 'Hide Notes' : 'Add Notes'}
                  </button>
                </div>

                {/* Notes editor — all admins can add notes; owner notes section only for owner */}
                {notesOpen && (
                  <div className="mt-3 space-y-2">
                    {ownerAccess && (
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: '#8b5cf6' }}>Owner Notes</label>
                        <textarea
                          defaultValue={req.owner_notes}
                          placeholder="Owner-only notes for this request..."
                          rows={2}
                          className="input-field text-xs w-full resize-none"
                          onBlur={e => {
                            if (e.target.value !== req.owner_notes) {
                              updateOwnerNotes(req.id, e.target.value);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
