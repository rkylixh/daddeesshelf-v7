'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';

// ── Role definitions ───────────────────────────────────────
const ROLES = ['Owner', 'Developer', 'Administrator'] as const;
type Role = typeof ROLES[number];

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Owner: [
    'Support Tickets & Inquiries',
    'Book Detail Management',
    'Bundle Management',
    'Genre Management',
    'Payment Verification',
    'Payment Confirmation',
    'Final Order Approval',
    'Tracking Number Updates',
    'Refund Reference Numbers',
    'Financial Reports',
    'Issue & Cancel Store Credits',
  ],
  Developer: [
    'Support Tickets & Inquiries',
    'Book Detail Management',
    'Bundle Management',
    'Genre Management',
    'Homepage Configuration',
    'FAQ Management',
    'Feature Management',
    'Database Configuration',
    'Inventory Configuration',
    'Bundle Configuration',
    'Genre Configuration',
    'Admin Role Management',
    'System Configuration',
    'Backup / Restore',
  ],
  Administrator: [
    'Support Tickets & Inquiries',
    'Book Detail Management',
    'Bundle Management',
    'Genre Management',
    'View Orders',
    'Update Order Status',
    'Manage Inventory',
    'Manage Title Requests',
    'Manage Wishlists',
    'View Audit Logs',
    'Manage Comments',
    'View Store Credits (read-only)',
  ],
};

const ROLE_COLORS: Record<Role, string> = {
  Owner: '#f59e0b',
  Developer: '#8b5cf6',
  Administrator: '#3b82f6',
};

// ── Default admin users ────────────────────────────────────
const DEFAULT_ADMINS = [
  { tiktok_handle: '@daddees.shelf', display_name: "Daddee\'s Shelf", role: 'Owner' as Role },
  { tiktok_handle: '@ikaynah26', display_name: 'Ikaynah', role: 'Administrator' as Role },
  { tiktok_handle: '@maduday', display_name: 'Maduday', role: 'Administrator' as Role },
  { tiktok_handle: '@maximum_violet', display_name: 'Maximum Violet', role: 'Administrator' as Role },
  { tiktok_handle: '@reseldt', display_name: 'Reseldt', role: 'Administrator' as Role },
  { tiktok_handle: '@tdleser', display_name: 'Tdleser', role: 'Administrator' as Role },
  { tiktok_handle: '@internalerror502', display_name: 'InternalError502', role: 'Developer' as Role },
];

interface AdminUser {
  id?: string;
  tiktok_handle: string;
  display_name: string;
  role: Role;
  customer_pin?: string;
  created_at?: string;
}

export default function AdminUsersContent() {
  const [users, setUsers] = useState<AdminUser[]>(DEFAULT_ADMINS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [activeRole, setActiveRole] = useState<Role | 'All'>('All');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setUsers(data as AdminUser[]);
      }
    } catch {
      // Use defaults if table doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const updateRole = async (handle: string, role: Role) => {
    const user = users.find(u => u.tiktok_handle === handle);
    setSaving(handle);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ role })
        .eq('tiktok_handle', handle);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.tiktok_handle === handle ? { ...u, role } : u));
      showToast('Role updated');
      await logAudit({
        action: 'ADMIN_ROLE_UPDATED',
        module: 'Admin Users',
        target_ref: handle,
        prev_value: user?.role ?? '',
        new_value: role,
        explanation: `Admin role for ${handle} changed from "${user?.role ?? 'unknown'}" to "${role}"`,
      });
    } catch {
      showToast('Update failed — table may not exist yet');
    } finally {
      setSaving(null);
    }
  };

  const savePin = async (handle: string) => {
    if (!newPin || newPin.length < 4) { showToast('PIN must be at least 4 characters'); return; }
    setSaving(handle);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ customer_pin: newPin })
        .eq('tiktok_handle', handle);
      if (error) throw error;
      showToast('PIN updated');
      await logAudit({
        action: 'ADMIN_PIN_UPDATED',
        module: 'Admin Users',
        target_ref: handle,
        prev_value: '(hidden)',
        new_value: '(hidden)',
        explanation: `Admin PIN updated for ${handle}`,
      });
      setEditingPin(null);
      setNewPin('');
    } catch {
      showToast('PIN update failed — table may not exist yet');
    } finally {
      setSaving(null);
    }
  };

  const filteredUsers = activeRole === 'All' ? users : users.filter(u => u.role === activeRole);

  return (
    <AdminLayout title="Admin Users">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold animate-fade-in"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: 'var(--primary-bright)' }}
        >
          {toast}
        </div>
      )}

      {/* Role filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['All', ...ROLES] as const).map(role => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className="text-xs px-4 py-2 rounded-full font-semibold transition-all"
            style={{
              background: activeRole === role
                ? (role === 'All' ? 'linear-gradient(135deg, #8b5cf6, #4f46e5)' : `${ROLE_COLORS[role as Role]}30`)
                : 'var(--muted)',
              color: activeRole === role
                ? (role === 'All' ? '#fff' : ROLE_COLORS[role as Role])
                : 'var(--foreground-muted)',
              border: `1px solid ${activeRole === role ? (role === 'All' ? 'transparent' : ROLE_COLORS[role as Role] + '60') : 'var(--border)'}`,
            }}
          >
            {role} {role !== 'All' && `(${users.filter(u => u.role === role).length})`}
          </button>
        ))}
      </div>

      {/* Role permissions reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {ROLES.map(role => (
          <div
            key={role}
            className="rounded-xl p-4"
            style={{ background: `${ROLE_COLORS[role]}08`, border: `1px solid ${ROLE_COLORS[role]}30` }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: ROLE_COLORS[role] }}>{role}</p>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[role].map(perm => (
                <li key={perm} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  <span style={{ color: ROLE_COLORS[role] }}>✦</span>
                  {perm}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const roleColor = ROLE_COLORS[user.role] ?? '#6b7280';
            return (
              <div
                key={user.tiktok_handle}
                className="rounded-xl p-5"
                style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40` }}
                    >
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{user.display_name}</p>
                      <p className="text-xs" style={{ color: 'var(--primary-bright)' }}>{user.tiktok_handle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Role badge (read-only) */}
                    <span
                      className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ background: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40` }}
                    >
                      {user.role}
                    </span>

                    {/* PIN management */}
                    {editingPin === user.tiktok_handle ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={newPin}
                          onChange={e => setNewPin(e.target.value)}
                          placeholder="New PIN"
                          maxLength={8}
                          className="input-field text-xs py-1.5 w-24"
                        />
                        <button
                          onClick={() => savePin(user.tiktok_handle)}
                          disabled={saving === user.tiktok_handle}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingPin(null); setNewPin(''); }}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingPin(user.tiktok_handle)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
                      >
                        Change PIN
                      </button>
                    )}
                  </div>
                </div>

                {/* Permissions preview */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ROLE_PERMISSIONS[user.role].map(perm => (
                    <span
                      key={perm}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: `${roleColor}10`, color: roleColor, border: `1px solid ${roleColor}20` }}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
