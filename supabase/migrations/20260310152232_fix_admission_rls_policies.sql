/*
  # Admissionテーブルのポリシー修正

  1. 変更内容
    - admission読み取りポリシーを修正
    - auth.usersへのクエリを削除し、auth.jwt()を使用するように変更
    - これにより、usersテーブルへの権限エラーを回避

  2. セキュリティ
    - 認証済みユーザーは自分のemailに対応するadmissionレコードのみ読み取り可能
*/

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read own admission status" ON admission;

-- 新しいポリシーを作成（auth.jwt()を使用）
CREATE POLICY "Users can read own admission status"
  ON admission
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');