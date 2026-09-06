-- Re-trigger notification email for order DDS-20260825-7461
-- This is a safety re-send in case the original trigger (20260825000002) silently failed
-- due to app.supabase_url or app.supabase_service_role_key not being configured at that time.

DO $$
DECLARE
  v_order record;
  v_supabase_url text;
  v_service_role_key text;
  v_payload jsonb;
BEGIN
  -- Fetch the order
  SELECT ref_number, tiktok_handle, total_price, items, payment_ref, status
  INTO v_order
  FROM public.orders
  WHERE ref_number = 'DDS-20260825-7461'
  LIMIT 1;

  IF v_order.ref_number IS NULL THEN
    RAISE NOTICE 'Order DDS-20260825-7461 not found — skipping notification.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found order % — queuing notification email (re-trigger).', v_order.ref_number;

  -- Read app settings
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.supabase_service_role_key', true);

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    RAISE NOTICE 'app.supabase_url is not configured — cannot call edge function. Trigger manually via Supabase dashboard.';
    RETURN;
  END IF;

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE NOTICE 'app.supabase_service_role_key is not configured — cannot call edge function. Trigger manually via Supabase dashboard.';
    RETURN;
  END IF;

  -- Build payload
  v_payload := jsonb_build_object(
    'type', 'new_order',
    'data', jsonb_build_object(
      'ref_number',    COALESCE(v_order.ref_number, ''),
      'tiktok_handle', COALESCE(v_order.tiktok_handle, ''),
      'total_price',   COALESCE(v_order.total_price, 0),
      'items',         COALESCE(v_order.items, '[]'::jsonb),
      'payment_ref',   COALESCE(v_order.payment_ref, ''),
      'status',        COALESCE(v_order.status, '')
    )
  );

  -- Call notify-email edge function via pg_net
  PERFORM net.http_post(
    url     := v_supabase_url || '/functions/v1/notify-email',
    body    := v_payload,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    )
  );

  RAISE NOTICE 'Notification email re-queued for order DDS-20260825-7461.';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not call edge function via pg_net: % — trigger manually via Supabase Edge Function dashboard with payload: {"type":"new_order","data":{"ref_number":"DDS-20260825-7461",...}}', SQLERRM;
END;
$$;
