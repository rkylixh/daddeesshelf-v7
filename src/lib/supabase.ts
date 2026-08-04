// BACKEND INTEGRATION POINT: Initialize Supabase client with environment variables
// Replace mock data calls with actual Supabase queries once connected
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

// Re-export the browser client for backward compatibility
export { createBrowserClient as createClient } from '@supabase/ssr';

// Legacy named export used in older components
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);