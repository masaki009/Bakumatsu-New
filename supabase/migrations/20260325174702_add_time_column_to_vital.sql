/*
  # Add time column to vital table

  1. Changes
    - Add `time` column to `vital` table to track study duration in minutes
  
  2. Column Details
    - `time` (integer): Study time in minutes, defaults to 0
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vital' AND column_name = 'time'
  ) THEN
    ALTER TABLE vital ADD COLUMN time integer DEFAULT 0;
  END IF;
END $$;
