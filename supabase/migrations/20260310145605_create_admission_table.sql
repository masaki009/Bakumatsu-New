/*
  # Admissionテーブルの作成

  1. 新しいテーブル
    - `admission`
      - `id` (uuid, primary key) - 一意のID
      - `email` (text, unique) - ユーザーのメールアドレス
      - `is_active` (boolean) - 承認フラグ（ON/OFF）
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. セキュリティ
    - admissionテーブルでRLSを有効化
    - 認証済みユーザーが自分のemailのレコードを読み取れるポリシー
    - 管理者のみが挿入・更新・削除できるポリシー

  3. 目的
    - ログイン時に、ユーザーのemailがこのテーブルに登録されていて
      is_activeがtrueの場合のみログインを許可する
*/

-- admissionテーブルを作成
CREATE TABLE IF NOT EXISTS admission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE admission ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが自分のemailのレコードを読み取れるポリシー
CREATE POLICY "Users can read own admission status"
  ON admission
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 管理者のみがレコードを挿入できるポリシー
CREATE POLICY "Admins can insert admission records"
  ON admission
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 管理者のみがレコードを更新できるポリシー
CREATE POLICY "Admins can update admission records"
  ON admission
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

-- 管理者のみがレコードを削除できるポリシー
CREATE POLICY "Admins can delete admission records"
  ON admission
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- admissionテーブルのupdated_atを自動更新するトリガー
DROP TRIGGER IF EXISTS update_admission_updated_at ON admission;
CREATE TRIGGER update_admission_updated_at
  BEFORE UPDATE ON admission
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();