/*
  # LearningInsight Table - 日次アドバイス・分析の履歴

  1. New Tables
    - `learning_insight`
      - `insightid` (uuid, primary key) - レコード一意識別子
      - `email` (text, foreign key) - SelfProfile.Email と紐付け
      - `diarydate` (date) - sDiary.Date と紐付け (1日1レコード)
      
      コメント分析 (次範囲・ひと言):
      - `sentimentscore` (integer) - OneWord / SelfTopic の感情スコア (-1~+1)
      - `topictag` (text) - 課題の自動分類タグ (例: 文法, 発音, 語彙)
      - `topicrepeatcount` (integer) - 同一タグが直近何日連続しているか (反復課題の検出)
      
      多分析 (多ギャップ):
      - `readinggapscore` (integer) - 当日ExReading - 1日目標単語数 (正=超過/負=不足)
      - `readingcumulative` (integer) - 累積多読語数 (その日までの合計、達成バー(-に活用))
      - `readingpacestatus` (text) - ペース判定 (ahead/on_track/behind) の3値
      
      AIアドバイス:
      - `advicetext` (text) - その日のチューターからのアドバイス全文
      - `advicetype` (text) - アドバイスの種類 (激励/軌道修正/祝辞/改善提案)
      - `userread` (boolean) - 生徒がアドバイスを確認済みかどうか

  2. Security
    - Enable RLS on `learning_insight` table
    - Add policies for authenticated users to read their own data
    - Add policies for authenticated users to insert their own data
    - Add policies for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS learning_insight (
  insightid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  diarydate date NOT NULL,
  sentimentscore integer CHECK (sentimentscore >= -1 AND sentimentscore <= 1),
  topictag text,
  topicrepeatcount integer DEFAULT 0,
  readinggapscore integer DEFAULT 0,
  readingcumulative integer DEFAULT 0,
  readingpacestatus text CHECK (readingpacestatus IN ('ahead', 'on_track', 'behind')),
  advicetext text,
  advicetype text,
  userread boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, diarydate)
);

ALTER TABLE learning_insight ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learning insights"
  ON learning_insight
  FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own learning insights"
  ON learning_insight
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own learning insights"
  ON learning_insight
  FOR UPDATE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own learning insights"
  ON learning_insight
  FOR DELETE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_learning_insight_email ON learning_insight(email);
CREATE INDEX IF NOT EXISTS idx_learning_insight_diarydate ON learning_insight(diarydate DESC);
CREATE INDEX IF NOT EXISTS idx_learning_insight_email_diarydate ON learning_insight(email, diarydate);
CREATE INDEX IF NOT EXISTS idx_learning_insight_userread ON learning_insight(userread) WHERE userread = false;
