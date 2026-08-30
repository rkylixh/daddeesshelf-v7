-- Migration: Automatic order email trigger via pg_net
-- Fires notify-email edge function on every new order INSERT
-- Prerequisites already met:
--   - pg_net enabled in 20260823000002_schedule_auto_onhand_cron.sql
--   - app.supabase_url and app.supabase_service_role_key configured (used by cron job)
--   - notify-email edge function reads API_ORDER_NOTIF secret

-- Trigger function: called after every INSERT on public.orders
CREATE OR REPLACE FUNCTION public.notify_email_on_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_supabase_url text;
  v_service_role_key text;
  v_payload jsonb;
BEGIN
  -- Read app settings (configured in Supabase project settings)
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.supabase_service_role_key', true);

  -- If settings are not configured, log and exit gracefully
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    RAISE WARNING 'notify_email_on_new_order: app.supabase_url is not configured — skipping email for order %', NEW.ref_number;
    RETURN NEW;
  END IF;

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE WARNING 'notify_email_on_new_order: app.supabase_service_role_key is not configured — skipping email for order %', NEW.ref_number;
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
  PERFORM net.http_post(
    url     := v_supabase_url || '/functions/v1/notify-email',
    body    := v_payload,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    )
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Never block the order insert — log and continue
  RAISE WARNING 'notify_email_on_new_order: failed to queue email for order % — %', NEW.ref_number, SQLERRM;
  RETURN NEW;
END;
$func$;

-- Drop existing trigger if any, then create fresh
DROP TRIGGER IF EXISTS trg_notify_email_on_new_order ON public.orders;
CREATE TRIGGER trg_notify_email_on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_on_new_order();
