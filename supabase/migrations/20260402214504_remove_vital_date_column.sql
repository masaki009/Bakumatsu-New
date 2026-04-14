/*
  # vitalテーブルのdate依存削除

  ## 概要
  vitalテーブルからdateカラムを削除し、emailをPRIMARY KEYに変更します。
  これにより、日付に依存しない単一レコード方式に変更されます。

  ## 変更内容

  ### 1. vitalテーブル
  - dateカラムを削除
  - PRIMARY KEYを(user_id, date)から(user_id)に変更
  - timeカラムをinteger型に変更（分単位の合計学習時間として使用）
  - last_updated_dateは維持（toilet/sickの自動更新に必要）

  ### 2. RLS policies
  - 既存のポリシーを維持
  - 日付条件は削除

  ## 重要な注意点
  - last_updated_dateは維持されます（toilet/sick自動増加ロジックで使用）
  - ページ離脱時にlast_updated_dateを更新するロジックも維持されます
  - 経過日数の計算はlast_updated_dateと現在日付の比較で行われます
*/

-- vitalテーブルを再作成
DROP TABLE IF EXISTS vital CASCADE;

CREATE TABLE vital (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  time integer DEFAULT 0,
  energy integer DEFAULT 0,
  readbooks integer DEFAULT 0,
  toilet integer DEFAULT 0,
  sick integer DEFAULT 0,
  last_updated_date date
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_vital_user_id ON vital(user_id);
CREATE INDEX IF NOT EXISTS idx_vital_email ON vital(email);
CREATE INDEX IF NOT EXISTS idx_vital_last_updated_date ON vital(last_updated_date);

-- RLSを有効化
ALTER TABLE vital ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
CREATE POLICY "Users can read own vital"
  ON vital
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vital"
  ON vital
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vital"
  ON vital
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own vital"
  ON vital
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());