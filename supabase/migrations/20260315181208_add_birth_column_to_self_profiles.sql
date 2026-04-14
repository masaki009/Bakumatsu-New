/*
  # Add birth column to self_profiles table

  1. Changes
    - Add `birth` column to `self_profiles` table
      - Type: date
      - Nullable: true (optional field for fortune telling feature)
      - Description: User's birthday in yyyy-mm-dd format

  2. Notes
    - This field is optional and only needed if the user wants to use fortune telling features
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'self_profiles' AND column_name = 'birth'
  ) THEN
    ALTER TABLE self_profiles ADD COLUMN birth date;
  END IF;
END $$;
