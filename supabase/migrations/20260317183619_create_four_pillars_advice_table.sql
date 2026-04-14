/*
  # Create Four Pillars Advice Table

  1. New Tables
    - `four_pillars_advice`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `advice_date` (date) - The date for which advice was generated
      - `birth_time` (text) - Birth time in HH:mm format
      - `year_pillar` (text) - Year pillar (干支)
      - `month_pillar` (text) - Month pillar (干支)
      - `day_pillar` (text) - Day pillar (干支)
      - `today_pillar` (text) - Today's pillar (干支)
      - `element_balance` (jsonb) - Five element balance {木, 火, 土, 金, 水}
      - `today_energy` (text) - Today's energy explanation
      - `learning_advice` (jsonb) - Array of 3 learning advice items
      - `cautions` (text) - Things to be careful about
      - `lucky_activities` (jsonb) - 7 learning activities with ratings
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `four_pillars_advice` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to insert their own data
    - Add policy for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS four_pillars_advice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  advice_date date NOT NULL,
  birth_time text NOT NULL,
  year_pillar text NOT NULL,
  month_pillar text NOT NULL,
  day_pillar text NOT NULL,
  today_pillar text NOT NULL,
  element_balance jsonb NOT NULL,
  today_energy text NOT NULL,
  learning_advice jsonb NOT NULL,
  cautions text NOT NULL,
  lucky_activities jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, advice_date)
);

ALTER TABLE four_pillars_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own advice"
  ON four_pillars_advice
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advice"
  ON four_pillars_advice
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advice"
  ON four_pillars_advice
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
