'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface Customer {
  id: string;
  tiktok_handle: string;
  display_name: string | null;
  pin_enrolled: boolean;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

interface StoreCredit {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}

function ResetPinModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const supabase = createClient();
      const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');

      // Hash the new PIN
      const encoder = new TextEncoder();
      const data = encoder.encode(newPin + 'daddees-shelf-salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error: err } = await supabase
        .from('customers')
        .update({ pin_hash: pinHash, pin_enrolled: true, updated_at: new Date().toISOString() })
        .eq('tiktok_handle', customer.tiktok_handle);
      if (err) throw err;

      // Audit log
      await supabase.from('audit_logs').insert({
        admin_handle: session.tiktok_handle ?? 'unknown',
        action: 'CUSTOMER_PIN_RESET',
        module: 'Customer Management',
        target_ref: customer.tiktok_handle,
        prev_value: 'old_pin',
        new_value: 'reset',
        explanation: `Admin reset PIN for customer @${customer.tiktok_handle}`,
      });

      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch {
      setError('Failed to reset PIN. Please try again.');
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
          <div>
            <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Reset Customer PIN</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>@{customer.tiktok_handle}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {done ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">✓</div>
              <p className="font-semibold" style={{ color: '#10b981' }}>PIN Reset Successfully</p>
              <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                Share the new PIN with the customer via TikTok DM.
              </p>
            </div>
          ) : (
            <>
              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
              >
                <strong>⚠ Admin Action:</strong> This will immediately replace the customer&apos;s existing PIN. Share the new PIN securely via TikTok DM.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  New 4-Digit PIN <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field text-sm text-center tracking-widest font-mono"
                  placeholder="••••"
                  inputMode="numeric"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                  Enter a new 4-digit PIN to assign to this customer.
                </p>
              </div>

              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

              <div className="flex gap-3 justify-end">
                <button onClick={onClose} className="btn-ghost text-sm px-5 py-2.5 rounded-xl">Cancel</button>
                <button
                  onClick={handleReset}
                  disabled={saving || newPin.length !== 4}
                  className="btn-primary text-sm px-6 py-2.5"
                  style={{ opacity: saving || newPin.length !== 4 ? 0.6 : 1 }}
                >
                  {saving ? 'Resetting...' : 'Reset PIN ✦'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerDetailPanel({
  customer,
  onClose,
  onPinReset,
}: {
  customer: Customer;
  onClose: () => void;
  onPinReset: (c: Customer) => void;
}) {
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [orders, setOrders] = useState<{ ref_number: string; total_price: number; status: string; created_at: string }[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [notes, setNotes] = useState(customer.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const handle = customer.tiktok_handle.replace(/^@/, '');

    Promise.all([
      supabase.from('store_credits').select('id,amount,reason,status,created_at').eq('tiktok_handle', handle).order('created_at', { ascending: false }),
      supabase.from('orders').select('ref_number,total_price,status,created_at').or(`tiktok_handle.eq.${handle},tiktok_handle.eq.@${handle}`).order('created_at', { ascending: false }).limit(5),
    ]).then(([creditsRes, ordersRes]) => {
      setCredits((creditsRes.data ?? []) as StoreCredit[]);
      setOrders((ordersRes.data ?? []) as { ref_number: string; total_price: number; status: string; created_at: string }[]);
      setLoadingCredits(false);
    });
  }, [customer.tiktok_handle]);

  const totalActiveCredits = credits.filter(c => c.status === 'Active').reduce((s, c) => s + c.amount, 0);

  const saveNotes = async () => {
    setSavingNotes(true);
    const supabase = createClient();
    await supabase.from('customers').update({ notes, updated_at: new Date().toISOString() }).eq('tiktok_handle', customer.tiktok_handle);
    setSavingNotes(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>
              @{customer.tiktok_handle}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
              Customer since {new Date(customer.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* PIN Status + Reset */}
          <div
            className="flex items-center justify-between rounded-xl p-4"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>PIN Status</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: customer.pin_enrolled ? '#10b981' : '#f59e0b' }}>
                {customer.pin_enrolled ? '✓ PIN Enrolled' : '⚠ No PIN Set'}
              </p>
            </div>
            <button
              onClick={() => onPinReset(customer)}
              className="btn-secondary text-xs px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Icon name="KeyIcon" size={14} />
              Reset PIN
            </button>
          </div>

          {/* Store Credits Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>Store Credits</p>
              {totalActiveCredits > 0 && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  ₱{totalActiveCredits.toLocaleString()} Active
                </span>
              )}
            </div>
            {loadingCredits ? (
              <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Loading...</p>
            ) : credits.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>No store credits issued.</p>
            ) : (
              <div className="space-y-1.5">
                {credits.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <span style={{ color: 'var(--foreground-muted)' }} className="truncate pr-2">{c.reason}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold" style={{ color: c.status === 'Active' ? '#10b981' : 'var(--foreground-subtle)' }}>
                        ₱{c.amount.toLocaleString()}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{
                          background: c.status === 'Active' ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.15)',
                          color: c.status === 'Active' ? '#10b981' : '#6b7280',
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>Recent Orders</p>
              <div className="space-y-1.5">
                {orders.map(o => (
                  <div
                    key={o.ref_number}
                    className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <span className="font-mono" style={{ color: 'var(--foreground-muted)' }}>{o.ref_number}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--primary-bright)' }}>₱{o.total_price.toLocaleString()}</span>
                      <span style={{ color: 'var(--foreground-subtle)' }}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Admin Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field text-sm resize-none w-full"
              placeholder="Internal notes about this customer..."
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="btn-secondary text-xs px-4 py-1.5 rounded-lg"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomersContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [resetTarget, setResetTarget] = useState<Customer | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      setCustomers((data ?? []) as Customer[]);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.tiktok_handle.toLowerCase().includes(q) || (c.display_name ?? '').toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Customer Management">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Icon
            name="MagnifyingGlassIcon"
            size={15}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-subtle)' } as React.CSSProperties}
          />
          <input
            type="search"
            placeholder="Search by TikTok handle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field text-sm py-2 pl-9"
          />
        </div>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl p-3 mb-5 text-xs"
        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--foreground-muted)' }}
      >
        <strong style={{ color: 'var(--primary-bright)' }}>ℹ Customer Management:</strong> Customers appear here once they enroll a PIN. Click any row to view their profile, reset their PIN, or check their store credits and order history.
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Icon name="UsersIcon" size={40} style={{ color: 'var(--foreground-subtle)', margin: '0 auto 12px' } as React.CSSProperties} />
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {search ? 'No customers match your search.' : 'No customers enrolled yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>TikTok Handle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>PIN Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Enrolled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => setSelectedCustomer(customer)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--foreground)' }}>
                      @{customer.tiktok_handle}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{
                          background: customer.pin_enrolled ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color: customer.pin_enrolled ? '#10b981' : '#f59e0b',
                          border: `1px solid ${customer.pin_enrolled ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        }}
                      >
                        {customer.pin_enrolled ? 'Enrolled' : 'Not Set'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                      {new Date(customer.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setResetTarget(customer); }}
                        className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                        style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.25)' }}
                      >
                        <Icon name="KeyIcon" size={12} />
                        Reset PIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Panel */}
      {selectedCustomer && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onPinReset={c => { setSelectedCustomer(null); setResetTarget(c); }}
        />
      )}

      {/* Reset PIN Modal */}
      {resetTarget && (
        <ResetPinModal
          customer={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={loadCustomers}
        />
      )}
    </AdminLayout>
  );
}
