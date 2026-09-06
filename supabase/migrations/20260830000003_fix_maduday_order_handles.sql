-- Fix orders that belong to @maduday but were stored under a different handle variant.
-- This covers: 'maduday' (no @), '@twisterofplots', 'twisterofplots', or any other
-- variant that was used when the earlier order was placed.

DO $$
DECLARE
  v_updated int;
BEGIN
  -- Normalize any order whose tiktok_handle is a known variant of @maduday
  -- to the canonical '@maduday' format.
  UPDATE public.orders
  SET
    tiktok_handle = '@maduday',
    updated_at    = NOW()
  WHERE lower(tiktok_handle) IN (
    'maduday',
    '@maduday',
    'twisterofplots',
    '@twisterofplots'
  )
  AND tiktok_handle <> '@maduday';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Normalized % order row(s) to tiktok_handle = @maduday', v_updated;
END;
$$;

-- Also normalize title_requests for the same customer, just in case.
DO $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.title_requests
  SET
    tiktok_handle = '@maduday',
    updated_at    = NOW()
  WHERE lower(tiktok_handle) IN (
    'maduday',
    'twisterofplots',
    '@twisterofplots'
  )
  AND tiktok_handle <> '@maduday';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Normalized % title_request row(s) to tiktok_handle = @maduday', v_updated;
END;
$$;
