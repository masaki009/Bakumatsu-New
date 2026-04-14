/*
  # PolicyHistory Table - 学習方針の履歴ログ

  1. New Tables
    - `policy_history`
      - `policyid` (uuid, primary key) - レコード一意識別子
      - `email` (text, foreign key) - SelfProfile.Email と紐付け
      - `createdat` (date) - 方針を生成した日時
      - `triggertype` (text) - 生成トリガー (週次日報/目標変更/手動依頼)
      - `policytext` (text) - AIチューターが作成した学習方針の全文
      - `policysummary` (text) - 方針の要約 (1~2行)、一覧表示や比較に利用
      - `focusskills` (text) - 重点スキル (例: Reading, Speaking)、カンマ区切り
      - `basedlevel` (text) - 生成時のCurrent_Level (方針の根拠を記録)
      - `userreaction` (integer) - 生徒の反応スコア (1~5)、方針の再設置に活用
      - `isactive` (boolean) - 現在有効な方針かどうかのフラグ (最新作り=true)

  2. Security
    - Enable RLS on `policy_history` table
    - Add policies for authenticated users to read their own data
    - Add policies for authenticated users to insert their own data
    - Add policies for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS policy_history (
  policyid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  createdat date DEFAULT CURRENT_DATE,
  triggertype text,
  policytext text,
  policysummary text,
  focusskills text,
  basedlevel text,
  userreaction integer CHECK (userreaction >= 1 AND userreaction <= 5),
  isactive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE policy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own policy history"
  ON policy_history
  FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own policy history"
  ON policy_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own policy history"
  ON policy_history
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

CREATE POLICY "Users can delete own policy history"
  ON policy_history
  FOR DELETE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_policy_history_email ON policy_history(email);
CREATE INDEX IF NOT EXISTS idx_policy_history_createdat ON policy_history(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_policy_history_isactive ON policy_history(isactive) WHERE isactive = true;
