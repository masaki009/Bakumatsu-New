/*
  # pre_vitalテーブルの作成

  1. 新規テーブル
    - `pre_vital`
      - `id` (uuid, 主キー) - 自動生成されるユニークID
      - `user_id` (uuid, 外部キー) - auth.usersへの参照
      - `email` (text) - メールアドレス
      - `energy` (integer) - エネルギー値、デフォルト: 0
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. セキュリティ
    - RLSを有効化
    - 認証されたユーザーが自分のデータを閲覧できるポリシーを追加
    - 認証されたユーザーが自分のデータを挿入できるポリシーを追加
    - 認証されたユーザーが自分のデータを更新できるポリシーを追加
    - 認証されたユーザーが自分のデータを削除できるポリシーを追加
*/

-- pre_vitalテーブルを作成
CREATE TABLE IF NOT EXISTS pre_vital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  energy integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE pre_vital ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー: ユーザーは自分のデータを閲覧可能
CREATE POLICY "Users can view own pre_vital data"
  ON pre_vital
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERTポリシー: ユーザーは自分のデータを挿入可能
CREATE POLICY "Users can insert own pre_vital data"
  ON pre_vital
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATEポリシー: ユーザーは自分のデータを更新可能
CREATE POLICY "Users can update own pre_vital data"
  ON pre_vital
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETEポリシー: ユーザーは自分のデータを削除可能
CREATE POLICY "Users can delete own pre_vital data"
  ON pre_vital
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
