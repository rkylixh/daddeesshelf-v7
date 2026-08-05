-- Allow half-step spice levels (e.g. 3.5) by changing column type to NUMERIC(3,1)
ALTER TABLE public.books
  ALTER COLUMN spice_level TYPE NUMERIC(3,1) USING spice_level::NUMERIC(3,1);
