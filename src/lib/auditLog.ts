import { supabase } from '@/lib/supabase';

export function getAdminSession(): { tiktok_handle?: string; role?: string } | null {
  try {
    const raw = sessionStorage.getItem('admin_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function logAudit(params: {
  action: string;
  module: string;
  target_ref: string;
  prev_value?: string;
  new_value?: string;
  explanation?: string;
  notes?: string;
}) {
  const session = getAdminSession();
  try {
    await supabase.from('audit_logs').insert({
      admin_handle: session?.tiktok_handle ?? 'unknown',
      action: params.action,
      module: params.module,
      target_ref: params.target_ref,
      prev_value: params.prev_value ?? '',
      new_value: params.new_value ?? '',
      explanation: params.explanation ?? '',
      notes: params.notes ?? '',
    });
  } catch {
    // Audit log failures should never block the main action
  }
}
