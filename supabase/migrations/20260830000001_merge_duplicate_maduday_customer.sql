-- Merge duplicate customer records for @maduday / twisterofplots
-- Root cause: two separate rows existed — one created from an order (tiktok_handle = '@maduday',
-- no username) and one created via signup (username = 'twisterofplots', possibly different handle).
-- This migration merges them into one canonical record and cleans up customer_slugs.

DO $$
DECLARE
  v_maduday_id       uuid;
  v_twister_id       uuid;
  v_keep_id          uuid;
  v_remove_id        uuid;
  v_keep_handle      text;
  v_keep_username    text;
  v_keep_customer_id text;
  v_keep_pin_hash    text;
  v_keep_pin_enrolled boolean;
BEGIN

  -- ── 1. Find both candidate rows ──────────────────────────────────────────
  SELECT id INTO v_maduday_id
  FROM public.customers
  WHERE tiktok_handle = '@maduday'
  LIMIT 1;

  SELECT id INTO v_twister_id
  FROM public.customers
  WHERE username = 'twisterofplots'
  LIMIT 1;

  RAISE NOTICE 'maduday id: %, twisterofplots id: %', v_maduday_id, v_twister_id;

  -- ── 2. Nothing to do if they are already the same row (or one is missing) ─
  IF v_maduday_id IS NULL AND v_twister_id IS NULL THEN
    RAISE NOTICE 'Neither @maduday nor twisterofplots found — nothing to do.';
    RETURN;
  END IF;

  IF v_maduday_id IS NOT NULL AND v_twister_id IS NOT NULL AND v_maduday_id = v_twister_id THEN
    RAISE NOTICE 'Both identifiers already point to the same row (%) — no merge needed.', v_maduday_id;
    RETURN;
  END IF;

  -- ── 3. Decide which row to KEEP (prefer the one with a username set) ──────
  IF v_twister_id IS NOT NULL THEN
    -- The twisterofplots row has the username; keep it and patch the handle
    v_keep_id   := v_twister_id;
    v_remove_id := v_maduday_id;
  ELSE
    -- Only the @maduday row exists; keep it (no merge needed, just ensure handle is correct)
    v_keep_id   := v_maduday_id;
    v_remove_id := NULL;
  END IF;

  -- ── 4. Read canonical values from the row we are keeping ─────────────────
  SELECT tiktok_handle, username, customer_id, pin_hash, pin_enrolled
  INTO v_keep_handle, v_keep_username, v_keep_customer_id, v_keep_pin_hash, v_keep_pin_enrolled
  FROM public.customers
  WHERE id = v_keep_id;

  -- ── 5. If there is a separate @maduday row to remove, migrate its data ────
  IF v_remove_id IS NOT NULL THEN
    RAISE NOTICE 'Merging row % (remove) into row % (keep)', v_remove_id, v_keep_id;

    -- Patch the keep row: ensure tiktok_handle = '@maduday' and preserve any
    -- customer_id / pin data that may only exist on the remove row.
    UPDATE public.customers
    SET
      tiktok_handle = '@maduday',
      -- Only overwrite customer_id if the keep row has none
      customer_id   = COALESCE(v_keep_customer_id,
                        (SELECT customer_id FROM public.customers WHERE id = v_remove_id)),
      -- Only overwrite pin if the keep row has none
      pin_hash      = COALESCE(NULLIF(v_keep_pin_hash, ''),
                        (SELECT pin_hash FROM public.customers WHERE id = v_remove_id)),
      pin_enrolled  = COALESCE(v_keep_pin_enrolled,
                        (SELECT pin_enrolled FROM public.customers WHERE id = v_remove_id)),
      updated_at    = NOW()
    WHERE id = v_keep_id;

    -- Delete the duplicate row
    DELETE FROM public.customers WHERE id = v_remove_id;
    RAISE NOTICE 'Deleted duplicate customer row %', v_remove_id;

  ELSE
    -- Only one row exists; just make sure the handle is '@maduday'
    UPDATE public.customers
    SET tiktok_handle = '@maduday', updated_at = NOW()
    WHERE id = v_keep_id AND tiktok_handle <> '@maduday';
    RAISE NOTICE 'Ensured tiktok_handle = @maduday on row %', v_keep_id;
  END IF;

  -- ── 6. Fix customer_slugs — remove orphans, keep one canonical entry ──────
  -- Delete any slug rows that reference handles other than '@maduday' for this person
  DELETE FROM public.customer_slugs
  WHERE tiktok_handle <> '@maduday'
    AND tiktok_handle IN (
      -- handles that were previously associated with this person
      SELECT tiktok_handle FROM public.customers WHERE id = v_keep_id
      UNION ALL
      SELECT '@twisterofplots'   -- in case a slug was created with the username
      UNION ALL
      SELECT 'twisterofplots'
    );

  -- Ensure exactly one slug row exists for '@maduday'
  IF NOT EXISTS (SELECT 1 FROM public.customer_slugs WHERE tiktok_handle = '@maduday') THEN
    -- Derive a slug from the username
    INSERT INTO public.customer_slugs (tiktok_handle, user_slug)
    VALUES ('@maduday', 'twisterofplots')
    ON CONFLICT (tiktok_handle) DO NOTHING;
    RAISE NOTICE 'Inserted customer_slugs entry for @maduday';
  ELSE
    RAISE NOTICE 'customer_slugs entry for @maduday already exists — skipping insert.';
  END IF;

  RAISE NOTICE 'Merge complete. Canonical customer id: %', v_keep_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Merge failed: %', SQLERRM;
END;
$$;
