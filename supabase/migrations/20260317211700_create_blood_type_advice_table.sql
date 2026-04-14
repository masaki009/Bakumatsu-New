/*
  # Create blood_type_advice table

  1. New Tables
    - `blood_type_advice`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `advice_date` (date) - The date when the advice was generated
      - `blood_type` (text) - User's blood type (A, B, O, AB)
      - `week_of_month` (integer) - The week number of the month (1-5)
      - `week_name` (text) - Japanese week name (第1週, 第2週, etc.)
      - `advice` (text) - Main advice text
      - `encouragement` (text) - Encouragement message
      - `learning_tips` (jsonb) - Array of learning tips
      - `lucky_activity` (text) - Lucky learning activity for the week
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `blood_type_advice` table
    - Add policy for users to read their own advice
    - Add policy for users to insert their own advice
    - Add policy for users to update their own advice
*/

CREATE TABLE IF NOT EXISTS blood_type_advice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  advice_date date NOT NULL,
  blood_type text NOT NULL,
  week_of_month integer NOT NULL,
  week_name text NOT NULL,
  advice text NOT NULL,
  encouragement text NOT NULL,
  learning_tips jsonb NOT NULL,
  lucky_activity text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, advice_date)
);

ALTER TABLE blood_type_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blood type advice"
  ON blood_type_advice
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blood type advice"
  ON blood_type_advice
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blood type advice"
  ON blood_type_advice
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
