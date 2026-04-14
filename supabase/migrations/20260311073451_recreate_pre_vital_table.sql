/*
  # Pre_vitalテーブルの再作成

  1. 新しいテーブル
    - `pre_vital`
      - `id` (uuid, primary key) - 一意のID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `energy` (integer) - エネルギー累積値（学習活動の合計値）
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. セキュリティ
    - RLSを有効化
    - ユーザーは自分のデータのみ読み書き可能

  3. 重要事項
    - energyカラムはs_reading + o_speaking + listening + wordsの累積値を保存
    - ユーザーごとに1レコードのみ（user_idにUNIQUE制約）
*/

-- pre_vitalテーブルを作成
CREATE TABLE IF NOT EXISTS pre_vital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  energy integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- RLSを有効化
ALTER TABLE pre_vital ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can read own pre_vital"
  ON pre_vital FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pre_vital"
  ON pre_vital FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pre_vital"
  ON pre_vital FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pre_vital"
  ON pre_vital FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
