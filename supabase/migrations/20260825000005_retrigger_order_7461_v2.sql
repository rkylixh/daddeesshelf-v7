-- Re-trigger notification email for order DDS-20260825-7461 (v2)
-- Applied because: net._http_response and net.http_request_queue showed no rows after 20260825000004,
-- confirming the original notification was never queued. API_ORDER_NOTIF verified in Edge Function secrets.
-- This migration does NOT modify order data, order status, or any trigger definitions.

DO $$
DECLARE
  v_order record;
  v_supabase_url text;
  v_service_role_key text;
  v_payload jsonb;
  v_request_id bigint;
BEGIN
  -- Fetch the order (read-only — no UPDATE, no status change)
  SELECT ref_number, tiktok_handle, total_price, items, payment_ref, status
  INTO v_order
  FROM public.orders
  WHERE ref_number = 'DDS-20260825-7461'
  LIMIT 1;

  IF v_order.ref_number IS NULL THEN
    RAISE NOTICE '[retrigger-v2] Order DDS-20260825-7461 not found — skipping.';
    RETURN;
  END IF;

  RAISE NOTICE '[retrigger-v2] Found order % (status: %) — proceeding to queue notification.', v_order.ref_number, v_order.status;

  -- Read app settings
  v_supabase_url    := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.supabase_service_role_key', true);

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    RAISE NOTICE '[retrigger-v2] app.supabase_url is not configured — cannot call edge function.';
    RETURN;
  END IF;

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE NOTICE '[retrigger-v2] app.supabase_service_role_key is not configured — cannot call edge function.';
    RETURN;
  END IF;

  RAISE NOTICE '[retrigger-v2] app.supabase_url is set. app.supabase_service_role_key is set. Calling notify-email via pg_net.';

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

  -- Call notify-email edge function via pg_net and capture the request ID
  SELECT net.http_post(
    url     := v_supabase_url || '/functions/v1/notify-email',
    body    := v_payload,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    )
  ) INTO v_request_id;

  RAISE NOTICE '[retrigger-v2] pg_net request queued. Request ID: %. Verify response with: SELECT id, status_code, error_msg, created FROM net._http_response WHERE id = %;', v_request_id, v_request_id;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[retrigger-v2] pg_net call failed: %. Manually invoke notify-email from Supabase Edge Function dashboard with payload: {"type":"new_order","data":{"ref_number":"DDS-20260825-7461"}}', SQLERRM;
END;
$$;
