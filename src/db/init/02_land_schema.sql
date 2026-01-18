DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ne_land_10m') THEN
    -- table will be created by import step
    RAISE NOTICE 'ne_land_10m does not exist yet (ok).';
  END IF;
END $$;
