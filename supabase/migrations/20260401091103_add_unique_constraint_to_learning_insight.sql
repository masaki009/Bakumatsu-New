/*
  # learning_insightテーブルにユニーク制約を追加

  1. 変更内容
    - learning_insightテーブルに`user_id, diarydate`の複合ユニーク制約を追加
    - これにより、同じユーザーが同じ日付に複数のinsightレコードを持つことを防ぐ
    - upsert操作（ON CONFLICT）が正常に動作するようになる
  
  2. 理由
    - AIコーチフィードバック機能で、1日1回のフィードバック生成を保証するため
    - 既存のレコードがある場合は更新、ない場合は新規作成が可能になる
  
  3. 重要事項
    - 既存データに重複がある場合、この制約追加は失敗する
    - その場合は事前に重複データを削除する必要がある
*/

-- 既存の重複データを確認・削除（最新のものを残す）
DELETE FROM learning_insight a
USING learning_insight b
WHERE a.insightid < b.insightid
  AND a.user_id = b.user_id
  AND a.diarydate = b.diarydate
  AND a.user_id IS NOT NULL;

-- user_idとdiarydateの複合ユニーク制約を追加
ALTER TABLE learning_insight
ADD CONSTRAINT learning_insight_user_id_diarydate_key 
UNIQUE (user_id, diarydate);

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_learning_insight_user_id_diarydate 
ON learning_insight(user_id, diarydate);

-- user_idがNULLの場合に備えてemailのインデックスも追加
CREATE INDEX IF NOT EXISTS idx_learning_insight_email_diarydate 
ON learning_insight(email, diarydate) WHERE email IS NOT NULL;
