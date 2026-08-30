-- Migration: Fix order email trigger to use anon key instead of service role key
-- Root cause: app.supabase_url and app.supabase_service_role_key were NULL,
-- causing the trigger to silently skip every new order.
-- Fix: notify-email has verify_jwt=false, so the anon key is sufficient.
-- We store the project URL and anon key as app settings and use them in the trigger.

-- Step 1: Set app.supabase_url from the known project URL
-- Replace <YOUR_PROJECT_REF> with your actual Supabase project reference ID
-- (found in Supabase Dashboard → Project Settings → General → Reference ID)
-- Example: ALTER DATABASE postgres SET "app.supabase_url" = 'https://abcdefghijklmnop.supabase.co';
-- You MUST run this manually in the Supabase SQL Editor with your real project ref.

-- Step 2: Store the anon key (safe to use since notify-email has verify_jwt=false)
-- ALTER DATABASE postgres SET "app.supabase_anon_key" = '<your-anon-key>';
-- You MUST run this manually in the Supabase SQL Editor with your real anon key.

-- Step 3: Rewrite the trigger function to use anon key (no service role key needed)
CREATE OR REPLACE FUNCTION public.notify_email_on_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_supabase_url text;
  v_anon_key text;
  v_payload jsonb;
BEGIN
  -- Read app settings
  v_supabase_url := current_setting('app.supabase_url', true);
  -- Try anon key first, fall back to service role key for backward compatibility
  v_anon_key := COALESCE(
    NULLIF(current_setting('app.supabase_anon_key', true), ''),
    NULLIF(current_setting('app.supabase_service_role_key', true), '')
  );

  -- If URL is not configured, log and exit gracefully
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    RAISE WARNING 'notify_email_on_new_order: app.supabase_url is not configured — skipping email for order %. Run: ALTER DATABASE postgres SET "app.supabase_url" = ''https://<ref>.supabase.co'';', NEW.ref_number;
    RETURN NEW;
  END IF;

  IF v_anon_key IS NULL OR v_anon_key = '' THEN
    RAISE WARNING 'notify_email_on_new_order: neither app.supabase_anon_key nor app.supabase_service_role_key is configured — skipping email for order %. Run: ALTER DATABASE postgres SET "app.supabase_anon_key" = ''<anon-key>'';', NEW.ref_number;
    RETURN NEW;
  END IF;

  -- Build the payload for notify-email
  v_payload := jsonb_build_object(
    'type', 'new_order',
    'data', jsonb_build_object(
      'ref_number',    COALESCE(NEW.ref_number, ''),
      'tiktok_handle', COALESCE(NEW.tiktok_handle, ''),
      'total_price',   COALESCE(NEW.total_price, 0),
      'items',         COALESCE(NEW.items, '[]'::jsonb),
      'payment_ref',   COALESCE(NEW.payment_ref, ''),
      'status',        COALESCE(NEW.status, '')
    )
  );

  -- Call notify-email edge function asynchronously via pg_net
  -- verify_jwt=false on notify-email means anon key is sufficient
  PERFORM net.http_post(
    url     := v_supabase_url || '/functions/v1/notify-email',
    body    := v_payload,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    )
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Never block the order insert — log and continue
  RAISE WARNING 'notify_email_on_new_order: failed to queue email for order % — %', NEW.ref_number, SQLERRM;
  RETURN NEW;
END;
$func$;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_notify_email_on_new_order ON public.orders;
CREATE TRIGGER trg_notify_email_on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_on_new_order();
