// BACKEND INTEGRATION POINT: Initialize Supabase client with environment variables
// Replace mock data calls with actual Supabase queries once connected
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

// Legacy named export used in older components
import { createBrowserClient } from '@supabase/ssr';

// Re-export the browser client for backward compatibility
export const createClient = createBrowserClient;

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);