-- Fix TikTok handle for customer twisterofplots
-- Their correct TikTok handle is @maduday (was incorrectly set to match username)

DO $$
DECLARE
  v_customer_id uuid;
  v_current_handle text;
  v_maduday_exists boolean;
BEGIN
  -- Find the customer with username 'twisterofplots'
  SELECT id, tiktok_handle INTO v_customer_id, v_current_handle
  FROM public.customers
  WHERE username = 'twisterofplots'
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Customer twisterofplots not found — skipping.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found customer twisterofplots (id: %) with current tiktok_handle: %', v_customer_id, v_current_handle;

  -- Check if @maduday is already assigned to a DIFFERENT customer
  SELECT EXISTS (
    SELECT 1 FROM public.customers
    WHERE tiktok_handle = '@maduday'
      AND id <> v_customer_id
  ) INTO v_maduday_exists;

  IF v_maduday_exists THEN
    RAISE NOTICE '@maduday is already assigned to a different customer — skipping update to avoid duplicate.';
    RETURN;
  END IF;

  -- Update the tiktok_handle to @maduday
  UPDATE public.customers
  SET tiktok_handle = '@maduday',
      updated_at = NOW()
  WHERE id = v_customer_id;

  RAISE NOTICE 'Updated twisterofplots tiktok_handle from % to @maduday', v_current_handle;

  -- Also update customer_slugs if the old handle exists there
  -- (slugs table uses tiktok_handle as unique key)
  IF v_current_handle IS NOT NULL AND v_current_handle <> '@maduday' THEN
    -- Check if @maduday slug already exists
    IF EXISTS (SELECT 1 FROM public.customer_slugs WHERE tiktok_handle = '@maduday') THEN
      RAISE NOTICE 'customer_slugs already has @maduday entry — removing old slug entry for % to avoid orphan.', v_current_handle;
      DELETE FROM public.customer_slugs WHERE tiktok_handle = v_current_handle;
    ELSE
      -- Update the slug entry to point to the new handle
      UPDATE public.customer_slugs
      SET tiktok_handle = '@maduday'
      WHERE tiktok_handle = v_current_handle;
      RAISE NOTICE 'Updated customer_slugs tiktok_handle from % to @maduday', v_current_handle;
    END IF;
  END IF;
END;
$$;
