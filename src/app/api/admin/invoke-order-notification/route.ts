import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// One-time diagnostic route: invoke notify-email for DDS-20260825-7461
// Uses actual order data from Supabase — does NOT modify any order data.
// The notify-email Edge Function has verify_jwt: false, so anon key is sufficient to invoke it.
// Service role key is needed to read the order (bypasses RLS).

const TARGET_REF = 'DDS-20260825-7461';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Supabase URL or anon key not configured' }, { status: 500 });
  }

  // Prefer service role key for DB read (bypasses RLS); fall back to anon key
  const dbKey = serviceRoleKey || anonKey;
  const supabase = createClient(supabaseUrl, dbKey);

  // Step 1: Fetch the actual order — read-only, no modifications
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('ref_number, tiktok_handle, total_price, items, payment_ref, status')
    .eq('ref_number', TARGET_REF)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      {
        error: `Order ${TARGET_REF} not found or RLS blocked read`,
        detail: orderError?.message,
        hint: serviceRoleKey
          ? 'Order genuinely not found' :'Add SUPABASE_SERVICE_ROLE_KEY to .env to bypass RLS for this read',
      },
      { status: 404 }
    );
  }

  // Step 2: Build the new_order payload using actual order data (no invented values)
  const payload = {
    type: 'new_order',
    data: {
      ref_number: order.ref_number,
      tiktok_handle: order.tiktok_handle,
      total_price: order.total_price,
      items: order.items,
      payment_ref: order.payment_ref,
      status: order.status,
    },
  };

  // Step 3: Invoke the notify-email Edge Function
  // verify_jwt is false on this function, so anon key is sufficient as the bearer token
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/notify-email`;
  const invokeKey = serviceRoleKey || anonKey;

  let edgeStatus: number;
  let edgeBody: unknown;

  try {
    const edgeResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invokeKey}`,
      },
      body: JSON.stringify(payload),
    });

    edgeStatus = edgeResponse.status;
    edgeBody = await edgeResponse.json();
  } catch (fetchErr: unknown) {
    return NextResponse.json(
      { error: 'Failed to reach notify-email Edge Function', detail: String(fetchErr) },
      { status: 500 }
    );
  }

  // Step 4: Return diagnostic report (no secrets exposed)
  return NextResponse.json({
    invoked: true,
    order_ref: order.ref_number,
    notification_type: payload.type,
    edge_function_url: edgeFunctionUrl,
    edge_http_status: edgeStatus,
    edge_response: edgeBody,
    used_service_role_for_db: !!serviceRoleKey,
    note: 'Check Supabase Dashboard → Edge Functions → notify-email → Logs for full diagnostic output including API_ORDER_NOTIF presence and Resend response ID.',
  });
}
