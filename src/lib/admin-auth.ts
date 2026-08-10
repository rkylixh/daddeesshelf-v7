export const ADMIN_ACCESS_CODE = 'DADSHELF';

export interface AdminSessionUser {
  id: string;
  tiktok_handle: string;
  display_name?: string | null;
  role: string;
}

export function saveAdminSession(admin: AdminSessionUser): void {
  sessionStorage.setItem('admin_session', JSON.stringify({
    id: admin.id,
    tiktok_handle: admin.tiktok_handle,
    display_name: admin.display_name || admin.tiktok_handle,
    role: admin.role,
    authenticated_at: Date.now(),
  }));
}

/** Normalize TikTok handles for comparisons (@ optional). */
export function normalizeAdminHandle(handle: string): string {
  return (handle || '').trim().replace(/^@/, '').toLowerCase();
}

export function adminHandlesMatch(a: string, b: string): boolean {
  return normalizeAdminHandle(a) === normalizeAdminHandle(b);
}

export function resolveAdminDisplayName(
  message: { sender_handle: string; sender_display_name?: string | null },
  nameByHandle: Map<string, string>,
): string {
  const stored = message.sender_display_name?.trim();
  if (stored && !adminHandlesMatch(stored, message.sender_handle)) {
    return stored;
  }
  return (
    nameByHandle.get(normalizeAdminHandle(message.sender_handle)) ||
    stored ||
    message.sender_handle ||
    'Admin'
  );
}
