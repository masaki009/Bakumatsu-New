/*
  # 新規登録時のadmissionレコード自動作成を許可

  1. 変更内容
    - admissionテーブルのINSERTポリシーを更新
    - 認証済みユーザーが自分のemailでレコードを作成できるように変更
    - 管理者は引き続き全てのレコードを作成可能

  2. セキュリティ
    - ユーザーは自分のemailでのみレコードを作成可能
    - 既存のUPDATE/DELETEポリシーは変更なし（管理者のみ）
*/

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Admins can insert admission records" ON admission;

-- 新しいINSERTポリシー: ユーザーが自分のemailでレコードを作成可能
CREATE POLICY "Users can insert own admission record"
  ON admission
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );