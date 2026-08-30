-- Fix: @maduday user_slug was incorrectly set to 'twisterofplots' (the username).
-- Correct value is 'DS-7VXVZ34V' (the DS-format customer ID).
-- Also ensure the customers row has customer_id = 'DS-7VXVZ34V'.

DO $$
BEGIN
  -- Fix customer_slugs: set user_slug to the correct DS-format ID
  UPDATE public.customer_slugs
  SET user_slug = 'DS-7VXVZ34V'
  WHERE tiktok_handle = '@maduday'
    AND user_slug <> 'DS-7VXVZ34V';

  RAISE NOTICE 'customer_slugs: @maduday user_slug set to DS-7VXVZ34V';

  -- Also ensure the customers row reflects the correct customer_id
  UPDATE public.customers
  SET customer_id = 'DS-7VXVZ34V',
      updated_at  = NOW()
  WHERE lower(tiktok_handle) IN ('@maduday', 'maduday')
    AND (customer_id IS NULL OR customer_id <> 'DS-7VXVZ34V');

  RAISE NOTICE 'customers: @maduday customer_id set to DS-7VXVZ34V';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    RAISE;
END;
$$;
