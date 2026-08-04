'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface StoreCredit {
  id: string;
  tiktok_handle: string;
  amount: number;
  reason: string;
  issued_by: string;
  status: 'Active' | 'Used' | 'Expired' | 'Cancelled';
  order_ref: string | null;
  used_on_order_ref: string | null;
  created_at: string;
  updated_at: string;
}

const CREDIT_REASONS = [
  'Markdown Refund',
  'Lost Package',
  'Damaged Item',
  'Overpayment',
  'Goodwill Credit',
  'Other',
];

const STATUS_COLORS: Record<string, string> = {
  Active: '#10b981',
  Used: '#6b7280',
  Expired: '#f59e0b',
  Cancelled: '#ef4444',
};

function IssueCreditModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    tiktok_handle: '',
    amount: '',
    reason: CREDIT_REASONS[0],
    custom_reason: '',
    order_ref: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = form.tiktok_handle.trim().replace(/^@/, '');
    if (!handle) { setError('TikTok handle is required.'); return; }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { setError('Amount must be a positive number.'); return; }

    setSaving(true);
    setError('');
    try {
      const supabase = createClient();
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      const finalReason = form.reason === 'Other' ? form.custom_reason.trim() || 'Other' : form.reason;

      const { error: err } = await supabase.from('store_credits').insert({
        tiktok_handle: handle,
        amount,
        reason: finalReason,
        issued_by: session.tiktok_handle ?? 'admin',
        status: 'Active',
        order_ref: form.order_ref.trim() || null,
      });
      if (err) throw err;

      // Audit log
      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: 'STORE_CREDIT_ISSUED',
        module: 'Store Credits',
        target_ref: handle,
        prev_value: '0',
        new_value: String(amount),
        explanation: `Issued ₱${amount} store credit to @${handle}. Reason: ${finalReason}`,
      });

      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch {
      setError('Failed to issue store credit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Issue Store Credit</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✓</div>
              <p className="font-semibold" style={{ color: '#10b981' }}>Store Credit Issued!</p>
              <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                The credit will automatically apply on their next preorder.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
              >
                <strong>✦ Store Credit:</strong> This credit will automatically apply as a discount on the customer&apos;s next preorder submission.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Customer TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.tiktok_handle}
                  onChange={e => setForm(f => ({ ...f, tiktok_handle: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="@yourtiktok"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Credit Amount (₱) <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="e.g. 350"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Reason <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <select
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="select-field text-sm"
                >
                  {CREDIT_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              {form.reason === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    Custom Reason
                  </label>
                  <input
                    type="text"
                    value={form.custom_reason}
                    onChange={e => setForm(f => ({ ...f, custom_reason: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Describe the reason..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Linked Order Ref <span className="font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.order_ref}
                  onChange={e => setForm(f => ({ ...f, order_ref: e.target.value }))}
                  className="input-field text-sm font-mono"
                  placeholder="DDS-20260804-XXXX"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                  Link to the original order this credit is for (e.g. refund source).
                </p>
              </div>

              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={onClose} className="btn-ghost text-sm px-5 py-2.5 rounded-xl">Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm px-6 py-2.5"
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Issuing...' : 'Issue Credit ✦'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function CancelCreditModal({
  credit,
  onClose,
  onSuccess,
}: {
  credit: StoreCredit;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleCancel = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      await supabase.from('store_credits').update({ status: 'Cancelled', updated_at: new Date().toISOString() }).eq('id', credit.id);
      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: 'STORE_CREDIT_CANCELLED',
        module: 'Store Credits',
        target_ref: credit.tiktok_handle,
        prev_value: 'Active',
        new_value: 'Cancelled',
        explanation: `Cancelled ₱${credit.amount} store credit for @${credit.tiktok_handle}`,
      });
      onSuccess();
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--background-card)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <div className="px-6 py-5 space-y-4">
          <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Cancel Store Credit?</h2>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            This will cancel the <strong style={{ color: 'var(--primary-bright)' }}>₱{credit.amount.toLocaleString()}</strong> credit for <strong>@{credit.tiktok_handle}</strong>. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-ghost text-sm px-5 py-2.5 rounded-xl">Keep</button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-sm px-6 py-2.5 rounded-xl font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Cancelling...' : 'Cancel Credit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminStoreCreditsContent() {
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<StoreCredit | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const loadCredits = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('store_credits')
        .select('*')
        .order('created_at', { ascending: false });
      setCredits((data ?? []) as StoreCredit[]);
    } catch {
      setCredits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
    // Check if current admin is Owner
    try {
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      setIsOwner(session.role === 'Owner');
    } catch {
      setIsOwner(false);
    }
  }, [loadCredits]);

  const filtered = credits.filter(c => {
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !search || c.tiktok_handle.toLowerCase().includes(q) || c.reason.toLowerCase().includes(q) || (c.order_ref ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalActive = credits.filter(c => c.status === 'Active').reduce((s, c) => s + c.amount, 0);
  const totalIssued = credits.reduce((s, c) => s + c.amount, 0);

  return (
    <AdminLayout title="Store Credits">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Active Credits</p>
          <p className="font-display text-xl font-bold mt-1" style={{ color: '#10b981' }}>₱{totalActive.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Total Issued</p>
          <p className="font-display text-xl font-bold mt-1" style={{ color: 'var(--primary-bright)' }}>₱{totalIssued.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Total Records</p>
          <p className="font-display text-xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{credits.length}</p>
        </div>
      </div>

      {/* Owner-only notice for non-owners */}
      {!isOwner && (
        <div
          className="rounded-xl p-3 mb-5 text-xs flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
        >
          <span>🔒</span>
          <span><strong>View Only:</strong> Only the Owner can issue or cancel store credits.</span>
        </div>
      )}

      {/* Filters + Issue Button */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="MagnifyingGlassIcon"
            size={15}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-subtle)' } as React.CSSProperties}
          />
          <input
            type="search"
            placeholder="Search by handle, reason, order ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field text-sm py-2 pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="select-field text-sm py-2"
        >
          <option value="">All Statuses</option>
          {['Active', 'Used', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
        {isOwner && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="btn-primary text-sm px-5 py-2 flex items-center gap-2"
          >
            <Icon name="PlusIcon" size={15} />
            Issue Credit
          </button>
        )}
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl p-3 mb-5 text-xs"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--foreground-muted)' }}
      >
        <strong style={{ color: '#10b981' }}>✦ Auto-Apply:</strong> Active store credits automatically apply as a discount when the customer submits their next preorder using their TikTok handle. Credits have <strong style={{ color: '#10b981' }}>no expiry date</strong>.
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Icon name="CreditCardIcon" size={40} style={{ color: 'var(--foreground-subtle)', margin: '0 auto 12px' } as React.CSSProperties} />
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {search || statusFilter ? 'No credits match your filters.' : 'No store credits issued yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Linked Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Issued</th>
                  {isOwner && (
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(credit => (
                  <tr
                    key={credit.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                      @{credit.tiktok_handle}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: credit.status === 'Active' ? '#10b981' : 'var(--foreground-muted)' }}>
                      ₱{credit.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {credit.reason}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--foreground-subtle)' }}>
                      {credit.order_ref ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{
                          background: `${STATUS_COLORS[credit.status] ?? '#6b7280'}22`,
                          color: STATUS_COLORS[credit.status] ?? '#6b7280',
                          border: `1px solid ${STATUS_COLORS[credit.status] ?? '#6b7280'}44`,
                        }}
                      >
                        {credit.status}
                        {credit.used_on_order_ref ? ` · ${credit.used_on_order_ref}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                      {new Date(credit.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        {credit.status === 'Active' && (
                          <button
                            onClick={() => setCancelTarget(credit)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showIssueModal && isOwner && (
        <IssueCreditModal
          onClose={() => setShowIssueModal(false)}
          onSuccess={loadCredits}
        />
      )}

      {cancelTarget && isOwner && (
        <CancelCreditModal
          credit={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={loadCredits}
        />
      )}
    </AdminLayout>
  );
}
