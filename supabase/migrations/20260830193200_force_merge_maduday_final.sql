-- ─────────────────────────────────────────────────────────────────────────────
-- FINAL MERGE: @maduday / twisterofplots
-- Goal: one canonical customers row  (tiktok_handle='@maduday', username='twisterofplots',
--       customer_id='DS-RX8P2HKC', pin from whichever row has it)
--       one canonical customer_slugs row (@maduday → DS-RX8P2HKC)
--       all orders/title_requests normalized to tiktok_handle='@maduday'
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_maduday_row   RECORD;
  v_twister_row   RECORD;
  v_keep_id       uuid;
  v_remove_id     uuid;
  v_final_pin     text;
  v_final_enrolled boolean;
  v_final_cid     text;
  v_final_username text;
  v_final_display  text;
  v_final_email    text;
  v_final_notes    text;
BEGIN

  -- ── 1. Fetch both candidate rows ─────────────────────────────────────────
  SELECT * INTO v_maduday_row
  FROM public.customers
  WHERE lower(tiktok_handle) IN ('@maduday', 'maduday')
  LIMIT 1;

  SELECT * INTO v_twister_row
  FROM public.customers
  WHERE lower(username) = 'twisterofplots'
    AND (v_maduday_row IS NULL OR id <> v_maduday_row.id)
  LIMIT 1;

  RAISE NOTICE 'maduday row id: %, twisterofplots row id: %',
    v_maduday_row.id, v_twister_row.id;

  -- ── 2. Already merged? ────────────────────────────────────────────────────
  IF v_maduday_row.id IS NULL AND v_twister_row.id IS NULL THEN
    RAISE NOTICE 'No rows found for @maduday or twisterofplots — nothing to do.';
    RETURN;
  END IF;

  IF v_maduday_row.id IS NOT NULL AND v_twister_row.id IS NULL THEN
    -- Only the @maduday row exists — just ensure username is set
    UPDATE public.customers
    SET username    = COALESCE(username, 'twisterofplots'),
        customer_id = COALESCE(customer_id, 'DS-RX8P2HKC'),
        updated_at  = NOW()
    WHERE id = v_maduday_row.id;
    RAISE NOTICE 'Only @maduday row exists — ensured username/customer_id are set.';
    -- Fall through to slug cleanup below
    v_keep_id := v_maduday_row.id;
  ELSIF v_maduday_row.id IS NULL AND v_twister_row.id IS NOT NULL THEN
    -- Only the twisterofplots row exists — patch its handle
    UPDATE public.customers
    SET tiktok_handle = '@maduday',
        customer_id   = COALESCE(customer_id, 'DS-RX8P2HKC'),
        updated_at    = NOW()
    WHERE id = v_twister_row.id;
    RAISE NOTICE 'Only twisterofplots row exists — patched tiktok_handle to @maduday.';
    v_keep_id := v_twister_row.id;
  ELSE
    -- ── 3. Both rows exist — merge them ──────────────────────────────────────
    -- Strategy: keep the @maduday row (it has the correct tiktok_handle),
    -- pull username/customer_id/pin from whichever row has them, then delete the other.

    v_keep_id   := v_maduday_row.id;
    v_remove_id := v_twister_row.id;

    -- Best values: prefer non-null / non-empty from either row
    v_final_pin      := CASE
                          WHEN v_maduday_row.pin_hash IS NOT NULL AND v_maduday_row.pin_hash <> ''
                            THEN v_maduday_row.pin_hash
                          ELSE v_twister_row.pin_hash
                        END;
    v_final_enrolled := COALESCE(v_maduday_row.pin_enrolled, v_twister_row.pin_enrolled, false);
    v_final_cid      := COALESCE(
                          NULLIF(v_maduday_row.customer_id, ''),
                          NULLIF(v_twister_row.customer_id, ''),
                          'DS-RX8P2HKC'
                        );
    v_final_username := COALESCE(
                          NULLIF(v_maduday_row.username, ''),
                          NULLIF(v_twister_row.username, ''),
                          'twisterofplots'
                        );
    v_final_display  := COALESCE(v_maduday_row.display_name, v_twister_row.display_name);
    v_final_email    := COALESCE(v_maduday_row.email, v_twister_row.email);
    v_final_notes    := COALESCE(v_maduday_row.notes, v_twister_row.notes);

    RAISE NOTICE 'Merging: keep=% remove=% final_cid=% final_username=%',
      v_keep_id, v_remove_id, v_final_cid, v_final_username;

    -- Remap any orders that reference the remove row's customer_id or handle variants
    UPDATE public.orders
    SET tiktok_handle = '@maduday', updated_at = NOW()
    WHERE lower(tiktok_handle) IN ('twisterofplots', '@twisterofplots', 'maduday')
      AND tiktok_handle <> '@maduday';

    -- Remap title_requests similarly
    UPDATE public.title_requests
    SET tiktok_handle = '@maduday', updated_at = NOW()
    WHERE lower(tiktok_handle) IN ('twisterofplots', '@twisterofplots', 'maduday')
      AND tiktok_handle <> '@maduday';

    -- Remap store_credits
    UPDATE public.store_credits
    SET tiktok_handle = '@maduday', updated_at = NOW()
    WHERE lower(tiktok_handle) IN ('twisterofplots', '@twisterofplots', 'maduday')
      AND tiktok_handle <> '@maduday';

    -- Delete the duplicate row FIRST (before updating keep row, to avoid unique constraint issues)
    DELETE FROM public.customers WHERE id = v_remove_id;
    RAISE NOTICE 'Deleted duplicate customers row %', v_remove_id;

    -- Now update the keep row with merged values
    UPDATE public.customers
    SET
      tiktok_handle = '@maduday',
      username      = v_final_username,
      customer_id   = v_final_cid,
      pin_hash      = COALESCE(v_final_pin, ''),
      pin_enrolled  = v_final_enrolled,
      display_name  = v_final_display,
      email         = v_final_email,
      notes         = v_final_notes,
      updated_at    = NOW()
    WHERE id = v_keep_id;

    RAISE NOTICE 'Updated keep row % with merged values', v_keep_id;
  END IF;

  -- ── 4. Fix customer_slugs ─────────────────────────────────────────────────
  -- Remove any slug rows that are NOT the canonical @maduday entry
  DELETE FROM public.customer_slugs
  WHERE lower(tiktok_handle) IN ('twisterofplots', '@twisterofplots')
     OR (lower(tiktok_handle) = 'maduday');  -- without @ prefix variant

  RAISE NOTICE 'Cleaned up non-canonical customer_slugs rows';

  -- Ensure exactly one canonical slug exists for @maduday
  IF NOT EXISTS (
    SELECT 1 FROM public.customer_slugs WHERE tiktok_handle = '@maduday'
  ) THEN
    INSERT INTO public.customer_slugs (tiktok_handle, user_slug)
    VALUES ('@maduday', 'twisterofplots')
    ON CONFLICT (tiktok_handle) DO NOTHING;
    RAISE NOTICE 'Inserted canonical customer_slugs entry for @maduday';
  ELSE
    -- Ensure the user_slug is correct
    UPDATE public.customer_slugs
    SET user_slug = 'twisterofplots'
    WHERE tiktok_handle = '@maduday'
      AND user_slug <> 'twisterofplots';
    RAISE NOTICE 'customer_slugs entry for @maduday already exists — verified user_slug';
  END IF;

  RAISE NOTICE 'Final merge complete. Canonical customers row id: %', v_keep_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Merge failed with error: %', SQLERRM;
    RAISE;
END;
$$;
