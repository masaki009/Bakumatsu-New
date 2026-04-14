/*
  # Create sDiary table for daily learning reports

  1. New Tables
    - `s_diaries`
      - `id` (uuid, primary key) - レコードID
      - `user_id` (uuid, foreign key to users) - ユーザーID
      - `email` (text) - ユーザーメールアドレス
      - `date` (date) - 学習日付
      - `s_reading` (integer) - スラッシュリーディング問題の件数
      - `o_speaking` (integer) - パラフレイズ問題の件数
      - `listening` (integer) - リスニング（チャンク）件数
      - `words` (integer) - ボキャブラリーの件数
      - `ex_reading` (integer) - 音読数
      - `time` (integer) - 学習時間（分）
      - `self_judge` (integer) - 当日の自己評価（1-10）
      - `self_topic` (text) - 課題と感じたところ
      - `one_word` (text) - ひとこと（学んだこと、感じたこと、次の予定）
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `s_diaries` table
    - Add policies for authenticated users:
      - Users can view their own diary entries
      - Users can insert their own diary entries
      - Users can update their own diary entries
      - Users can delete their own diary entries
    - Add policies for admin users:
      - Admins can view all diary entries
      - Admins can update all diary entries

  3. Important Notes
    - Email and date combination should be unique per user
    - All numeric fields default to 0
    - Text fields can be null or empty
    - Self judge must be between 1 and 10
*/

-- Create s_diaries table
CREATE TABLE IF NOT EXISTS s_diaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  date date NOT NULL,
  s_reading integer DEFAULT 0,
  o_speaking integer DEFAULT 0,
  listening integer DEFAULT 0,
  words integer DEFAULT 0,
  ex_reading integer DEFAULT 0,
  time integer DEFAULT 0,
  self_judge integer CHECK (self_judge >= 1 AND self_judge <= 10),
  self_topic text DEFAULT '',
  one_word text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE s_diaries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own diary entries
CREATE POLICY "Users can view own diary entries"
  ON s_diaries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own diary entries
CREATE POLICY "Users can insert own diary entries"
  ON s_diaries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own diary entries
CREATE POLICY "Users can update own diary entries"
  ON s_diaries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own diary entries
CREATE POLICY "Users can delete own diary entries"
  ON s_diaries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all diary entries
CREATE POLICY "Admins can view all diary entries"
  ON s_diaries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can update all diary entries
CREATE POLICY "Admins can update all diary entries"
  ON s_diaries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_s_diaries_user_date ON s_diaries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_s_diaries_date ON s_diaries(date);