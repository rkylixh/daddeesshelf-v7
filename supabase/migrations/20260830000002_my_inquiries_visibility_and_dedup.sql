-- ── 1. Re-run customer deduplication for @maduday / twisterofplots ──────────
-- (idempotent — safe to run even if already merged)
DO $$
DECLARE
  v_maduday_id       uuid;
  v_twister_id       uuid;
  v_keep_id          uuid;
  v_remove_id        uuid;
  v_keep_customer_id text;
  v_keep_pin_hash    text;
  v_keep_pin_enrolled boolean;
BEGIN
  SELECT id INTO v_maduday_id
  FROM public.customers
  WHERE lower(tiktok_handle) IN ('@maduday', 'maduday')
  LIMIT 1;

  SELECT id INTO v_twister_id
  FROM public.customers
  WHERE lower(username) = 'twisterofplots'
  LIMIT 1;

  RAISE NOTICE 'maduday id: %, twisterofplots id: %', v_maduday_id, v_twister_id;

  IF v_maduday_id IS NULL AND v_twister_id IS NULL THEN
    RAISE NOTICE 'Neither @maduday nor twisterofplots found — nothing to do.';
    RETURN;
  END IF;

  IF v_maduday_id IS NOT NULL AND v_twister_id IS NOT NULL AND v_maduday_id = v_twister_id THEN
    RAISE NOTICE 'Already merged into one row (%) — ensuring handle is @maduday.', v_maduday_id;
    UPDATE public.customers
    SET tiktok_handle = '@maduday', updated_at = NOW()
    WHERE id = v_maduday_id AND tiktok_handle <> '@maduday';
    RETURN;
  END IF;

  IF v_twister_id IS NOT NULL THEN
    v_keep_id   := v_twister_id;
    v_remove_id := v_maduday_id;
  ELSE
    v_keep_id   := v_maduday_id;
    v_remove_id := NULL;
  END IF;

  SELECT customer_id, pin_hash, pin_enrolled
  INTO v_keep_customer_id, v_keep_pin_hash, v_keep_pin_enrolled
  FROM public.customers
  WHERE id = v_keep_id;

  IF v_remove_id IS NOT NULL THEN
    RAISE NOTICE 'Merging row % into row %', v_remove_id, v_keep_id;

    UPDATE public.customers
    SET
      tiktok_handle = '@maduday',
      customer_id   = COALESCE(v_keep_customer_id,
                        (SELECT customer_id FROM public.customers WHERE id = v_remove_id)),
      pin_hash      = COALESCE(NULLIF(v_keep_pin_hash, ''),
                        (SELECT pin_hash FROM public.customers WHERE id = v_remove_id)),
      pin_enrolled  = COALESCE(v_keep_pin_enrolled,
                        (SELECT pin_enrolled FROM public.customers WHERE id = v_remove_id)),
      updated_at    = NOW()
    WHERE id = v_keep_id;

    DELETE FROM public.customers WHERE id = v_remove_id;
    RAISE NOTICE 'Deleted duplicate row %', v_remove_id;
  ELSE
    UPDATE public.customers
    SET tiktok_handle = '@maduday', updated_at = NOW()
    WHERE id = v_keep_id AND lower(tiktok_handle) <> '@maduday';
    RAISE NOTICE 'Ensured tiktok_handle = @maduday on row %', v_keep_id;
  END IF;

  -- Fix customer_slugs
  DELETE FROM public.customer_slugs
  WHERE lower(tiktok_handle) IN ('twisterofplots', '@twisterofplots')
     OR (lower(tiktok_handle) NOT IN ('@maduday', 'maduday')
         AND id NOT IN (SELECT id FROM public.customer_slugs WHERE lower(tiktok_handle) IN ('@maduday','maduday')));

  IF NOT EXISTS (
    SELECT 1 FROM public.customer_slugs WHERE lower(tiktok_handle) IN ('@maduday','maduday')
  ) THEN
    INSERT INTO public.customer_slugs (tiktok_handle, user_slug)
    VALUES ('@maduday', 'twisterofplots')
    ON CONFLICT (tiktok_handle) DO NOTHING;
    RAISE NOTICE 'Inserted customer_slugs entry for @maduday';
  ELSE
    RAISE NOTICE 'customer_slugs entry for @maduday already exists.';
  END IF;

  RAISE NOTICE 'Dedup complete. Canonical id: %', v_keep_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Dedup failed: %', SQLERRM;
END;
$$;

-- ── 2. Add my_inquiries_visible setting to homepage_settings ─────────────────
INSERT INTO public.homepage_settings (key, value)
VALUES ('my_inquiries_visible', 'false')
ON CONFLICT (key) DO NOTHING;
