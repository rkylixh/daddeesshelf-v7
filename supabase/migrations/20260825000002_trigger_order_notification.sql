-- Trigger notification email for order DDS-20260825-7461
-- Uses pg_net extension to call the notify-email edge function

DO $$
DECLARE
  v_order record;
  v_supabase_url text;
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

  RAISE NOTICE 'Found order % — queuing notification email.', v_order.ref_number;

  -- Build payload
  v_payload := jsonb_build_object(
    'type', 'new_order',
    'data', jsonb_build_object(
      'ref_number', v_order.ref_number,
      'tiktok_handle', v_order.tiktok_handle,
      'total_price', v_order.total_price,
      'items', v_order.items,
      'payment_ref', v_order.payment_ref,
      'status', v_order.status
    )
  );

  -- Get Supabase project URL from app.settings (set by Supabase automatically)
  -- We use net.http_post from pg_net extension
  PERFORM net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/notify-email',
    body := v_payload::text,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key', true) || '"}'::jsonb
  );

  RAISE NOTICE 'Notification email queued for order DDS-20260825-7461.';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not call edge function via pg_net (may not be enabled): % — order data logged above for manual trigger.', SQLERRM;
END;
$$;
