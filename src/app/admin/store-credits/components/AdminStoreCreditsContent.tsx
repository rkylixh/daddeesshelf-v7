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
  is_active: boolean;
  order_ref: string | null;
  used_on_order_ref: string | null;
  created_at: string;
  updated_at: string;
}

// Researched store credit reasons
const CREDIT_REASONS = [
  'Refund Compensation',
  'Order Cancellation',
  'Damaged Item',
  'Wrong Item Sent',
  'Lost Package',
  'Late Delivery Compensation',
  'Overpayment',
  'Goodwill Gesture',
  'Loyalty Reward',
  'Promotional Credit',
  'Price Adjustment',
  'Duplicate Payment',
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

  // Customer selector state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<{ id: string; tiktok_handle: string }[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setCustomerResults([]); setShowCustomerDropdown(false); return; }
    setCustomerSearching(true);
    try {
      const supabase = createClient();
      const normalized = q.trim().replace(/^@/, '');
      const { data } = await supabase
        .from('customers')
        .select('id, tiktok_handle')
        .ilike('tiktok_handle', `%${normalized}%`)
        .limit(8);
      setCustomerResults(data ?? []);
      setShowCustomerDropdown(true);
    } catch {
      setCustomerResults([]);
    } finally {
      setCustomerSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => clearTimeout(t);
  }, [customerSearch, searchCustomers]);

  const selectCustomer = (handle: string) => {
    setForm(f => ({ ...f, tiktok_handle: handle.replace(/^@/, '') }));
    setCustomerSearch(handle);
    setShowCustomerDropdown(false);
  };

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
        is_active: false, // Requires activation toggle
        order_ref: form.order_ref.trim() || null,
      });
      if (err) throw err;

      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: 'STORE_CREDIT_ISSUED',
        module: 'Store Credits',
        target_ref: handle,
        prev_value: '0',
        new_value: String(amount),
        explanation: `Issued ₱${amount} store credit to @${handle}. Reason: ${finalReason}. Pending activation.`,
        notes: '',
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
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)' }}>
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
                Activate it in the Store Credits list before the customer can use it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                <strong>⚠ Activation Required:</strong> After issuing, you must toggle the credit to Active in the list before the customer can use it.
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Select Customer <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setForm(f => ({ ...f, tiktok_handle: e.target.value.replace(/^@/, '') }));
                    }}
                    className="input-field text-sm"
                    placeholder="Search customer by TikTok handle..."
                    autoComplete="off"
                  />
                  {customerSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                    </div>
                  )}
                  {showCustomerDropdown && customerResults.length > 0 && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl z-10"
                      style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
                    >
                      {customerResults.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCustomer(c.tiktok_handle)}
                          className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-opacity-10"
                          style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {c.tiktok_handle}
                        </button>
                      ))}
                    </div>
                  )}
                  {showCustomerDropdown && customerResults.length === 0 && !customerSearching && customerSearch.trim() && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl z-10 px-4 py-3 text-xs"
                      style={{ background: 'var(--background-card)', border: '1px solid var(--border)', color: 'var(--foreground-subtle)' }}
                    >
                      No customers found. You can still type the handle manually.
                    </div>
                  )}
                </div>
                {form.tiktok_handle && (
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                    Selected: <strong style={{ color: 'var(--primary-bright)' }}>@{form.tiktok_handle}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Credit Amount (₱) <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input type="number" required min="1" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input-field text-sm" placeholder="e.g. 350" />
              </div>

              {/* Store Credit Reason Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Store Credit Reason <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="select-field text-sm">
                  {CREDIT_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              {form.reason === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Custom Reason</label>
                  <input type="text" value={form.custom_reason} onChange={e => setForm(f => ({ ...f, custom_reason: e.target.value }))} className="input-field text-sm" placeholder="Describe the reason..." />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Linked Order Ref <span className="font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
                </label>
                <input type="text" value={form.order_ref} onChange={e => setForm(f => ({ ...f, order_ref: e.target.value }))} className="input-field text-sm font-mono" placeholder="DDS-20260804-XXXX" />
              </div>

              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={onClose} className="btn-ghost text-sm px-5 py-2.5 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm px-6 py-2.5" style={{ opacity: saving ? 0.7 : 1 }}>
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
      await supabase.from('store_credits').update({ status: 'Cancelled', is_active: false, updated_at: new Date().toISOString() }).eq('id', credit.id);
      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: 'STORE_CREDIT_CANCELLED',
        module: 'Store Credits',
        target_ref: credit.tiktok_handle,
        prev_value: 'Active',
        new_value: 'Cancelled',
        explanation: `Cancelled ₱${credit.amount} store credit for @${credit.tiktok_handle}`,
        notes: '',
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
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="px-6 py-5 space-y-4">
          <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Cancel Store Credit?</h2>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            This will cancel the <strong style={{ color: 'var(--primary-bright)' }}>₱{credit.amount.toLocaleString()}</strong> credit for <strong>@{credit.tiktok_handle}</strong>. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-ghost text-sm px-5 py-2.5 rounded-xl">Keep</button>
            <button onClick={handleCancel} disabled={saving} className="text-sm px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Cancelling...' : 'Cancel Credit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Reason Modal ──────────────────────────────────────────────────────
function EditReasonModal({
  credit,
  onClose,
  onSuccess,
}: {
  credit: StoreCredit;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState(credit.reason);
  const [customReason, setCustomReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      const finalReason = reason === 'Other' ? customReason.trim() || 'Other' : reason;
      await supabase.from('store_credits').update({ reason: finalReason, updated_at: new Date().toISOString() }).eq('id', credit.id);
      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: 'STORE_CREDIT_REASON_UPDATED',
        module: 'Store Credits',
        target_ref: credit.tiktok_handle,
        prev_value: credit.reason,
        new_value: finalReason,
        explanation: `Reason updated for ₱${credit.amount} store credit of @${credit.tiktok_handle}`,
        notes: '',
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
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div className="px-6 py-5 space-y-4">
          <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Edit Reason</h2>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>@{credit.tiktok_handle} · ₱{credit.amount.toLocaleString()}</p>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Reason for Store Credit</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="select-field text-sm">
              {CREDIT_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          {reason === 'Other' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Custom Reason</label>
              <input type="text" value={customReason} onChange={e => setCustomReason(e.target.value)} className="input-field text-sm" placeholder="Describe the reason..." />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-ghost text-sm px-5 py-2.5 rounded-xl">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-6 py-2.5" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Reason'}
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
  const [editReasonTarget, setEditReasonTarget] = useState<StoreCredit | null>(null);
  const [isOwnerRole, setIsOwnerRole] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadCredits = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.from('store_credits').select('*').order('created_at', { ascending: false });
      setCredits((data ?? []) as StoreCredit[]);
    } catch {
      setCredits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
    try {
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      setIsOwnerRole(session.role === 'Owner' || session.role === 'Developer');
    } catch {
      setIsOwnerRole(false);
    }
  }, [loadCredits]);

  const handleToggleActive = async (credit: StoreCredit) => {
    setTogglingId(credit.id);
    try {
      const supabase = createClient();
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
      const newActive = !credit.is_active;
      await supabase.from('store_credits').update({ is_active: newActive, updated_at: new Date().toISOString() }).eq('id', credit.id);
      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: newActive ? 'STORE_CREDIT_ACTIVATED' : 'STORE_CREDIT_DEACTIVATED',
        module: 'Store Credits',
        target_ref: credit.tiktok_handle,
        prev_value: credit.is_active ? 'Active' : 'Inactive',
        new_value: newActive ? 'Active' : 'Inactive',
        explanation: `Store credit of ₱${credit.amount} for @${credit.tiktok_handle} ${newActive ? 'activated' : 'deactivated'}`,
        notes: '',
      });
      loadCredits();
    } catch {
      // silent
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = credits.filter(c => {
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !search || c.tiktok_handle.toLowerCase().includes(q) || c.reason.toLowerCase().includes(q) || (c.order_ref ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalActive = credits.filter(c => c.status === 'Active' && c.is_active).reduce((s, c) => s + c.amount, 0);
  const totalPending = credits.filter(c => c.status === 'Active' && !c.is_active).reduce((s, c) => s + c.amount, 0);
  const totalIssued = credits.reduce((s, c) => s + c.amount, 0);

  return (
    <AdminLayout title="Store Credits">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Active Credits</p>
          <p className="font-display text-xl font-bold mt-1" style={{ color: '#10b981' }}>₱{totalActive.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Pending Activation</p>
          <p className="font-display text-xl font-bold mt-1" style={{ color: '#f59e0b' }}>₱{totalPending.toLocaleString()}</p>
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
      {!isOwnerRole && (
        <div className="rounded-xl p-3 mb-5 text-xs flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
          <span>🔒</span>
          <span><strong>View Only:</strong> Only the Owner or Developer can issue, activate, or cancel store credits.</span>
        </div>
      )}

      {/* Pending activation banner */}
      {credits.filter(c => c.status === 'Active' && !c.is_active).length > 0 && (
        <div className="rounded-xl p-3 mb-5 text-xs flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
          <span>⏳</span>
          <span>
            <strong>{credits.filter(c => c.status === 'Active' && !c.is_active).length} credit(s) pending activation.</strong> Toggle the activation switch to make them usable by customers.
          </span>
        </div>
      )}

      {/* Filters + Issue Button */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="MagnifyingGlassIcon" size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <input type="search" placeholder="Search by handle, reason, order ref..." value={search} onChange={e => setSearch(e.target.value)} className="input-field text-sm py-2 pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field text-sm py-2">
          <option value="">All Statuses</option>
          {['Active', 'Used', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
        {isOwnerRole && (
          <button onClick={() => setShowIssueModal(true)} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
            <Icon name="PlusIcon" size={15} />
            Issue Credit
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="rounded-xl p-3 mb-5 text-xs" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--foreground-muted)' }}>
        <strong style={{ color: '#10b981' }}>✦ Activation Required:</strong> Credits must be toggled <strong style={{ color: '#10b981' }}>Active</strong> before customers can apply them at checkout. Credits auto-created from refunds start as <strong>Pending</strong>.
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
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Active</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Issued</th>
                  {isOwnerRole && (
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(credit => (
                  <tr key={credit.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                      @{credit.tiktok_handle}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: credit.status === 'Active' && credit.is_active ? '#10b981' : 'var(--foreground-muted)' }}>
                      ₱{credit.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <div className="flex items-center gap-1.5">
                        <span>{credit.reason || '—'}</span>
                        {isOwnerRole && credit.status === 'Active' && (
                          <button
                            onClick={() => setEditReasonTarget(credit)}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--muted)', color: 'var(--foreground-subtle)', border: '1px solid var(--border)' }}
                            title="Edit reason"
                          >
                            ✎
                          </button>
                        )}
                      </div>
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
                    <td className="px-4 py-3">
                      {credit.status === 'Active' ? (
                        <button
                          onClick={() => isOwnerRole && handleToggleActive(credit)}
                          disabled={togglingId === credit.id || !isOwnerRole}
                          className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
                          style={{
                            background: credit.is_active ? '#10b981' : 'var(--muted)',
                            border: `1px solid ${credit.is_active ? '#10b981' : 'var(--border)'}`,
                            cursor: isOwnerRole ? 'pointer' : 'default',
                            opacity: togglingId === credit.id ? 0.6 : 1,
                          }}
                          title={isOwnerRole ? (credit.is_active ? 'Deactivate credit' : 'Activate credit') : 'Owner only'}
                        >
                          <span
                            className="inline-block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                            style={{ transform: credit.is_active ? 'translateX(24px)' : 'translateX(2px)' }}
                          />
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                      {new Date(credit.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    {isOwnerRole && (
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

      {showIssueModal && isOwnerRole && (
        <IssueCreditModal onClose={() => setShowIssueModal(false)} onSuccess={loadCredits} />
      )}

      {cancelTarget && isOwnerRole && (
        <CancelCreditModal credit={cancelTarget} onClose={() => setCancelTarget(null)} onSuccess={loadCredits} />
      )}

      {editReasonTarget && isOwnerRole && (
        <EditReasonModal credit={editReasonTarget} onClose={() => setEditReasonTarget(null)} onSuccess={loadCredits} />
      )}
    </AdminLayout>
  );
}
