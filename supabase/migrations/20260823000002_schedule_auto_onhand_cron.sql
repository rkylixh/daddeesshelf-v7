-- Migration: Schedule auto-onhand cron job via pg_cron
-- This schedules the auto-onhand edge function to run daily at 2am UTC
-- The function silently switches pre-order titles to on-hand 1 week after their ETA date

-- Enable pg_cron extension (pre-installed in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'auto-onhand-daily'
  ) THEN
    PERFORM cron.unschedule('auto-onhand-daily');
  END IF;
END $$;

-- Schedule the edge function to run daily at 2:00 AM UTC
-- It will call the auto-onhand edge function via HTTP
SELECT cron.schedule(
  'auto-onhand-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/auto-onhand',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
