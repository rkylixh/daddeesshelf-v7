// Customer auth helpers — completely separate from admin auth
// Uses localStorage for session persistence (no Supabase Auth)

export interface CustomerSession {
  customerId: string;       // UUID from customers.id
  customerCode: string;     // e.g. "DS-XXXXXXXX" from customers.customer_id
  username: string;
  tiktokHandle: string;
  authenticatedAt: number;
}

const SESSION_KEY = 'ds_customer_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function saveCustomerSession(session: CustomerSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCustomerSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as CustomerSession;
    // Expire after TTL
    if (Date.now() - session.authenticatedAt > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearCustomerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

/** Generate a unique customer code like DS-XXXXXXXX */
export function generateCustomerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DS-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Hash PIN with the same salt used in orders */
export async function hashCustomerPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'daddees-shelf-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
