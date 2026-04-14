/*
  # vital テーブルの time カラムを integer 型に変更

  1. 変更内容
    - vital テーブルの time カラムを timestamptz から integer に変更
    - time は総学習時間（分単位）を格納
    - 既存の timestamptz データは削除される
    - DEFAULT 0 で初期化
    - NOT NULL 制約を追加

  2. データ初期化
    - 全ユーザーの vital.time を s_diaries の time の合計値で初期化
    - s_diaries にデータがないユーザーは 0 に設定

  3. 注意事項
    - このマイグレーションにより、既存の time データは失われます
    - 新しい time は s_diaries から再計算されるため、データの整合性は保たれます
*/

-- vital テーブルの time カラムを削除
ALTER TABLE vital DROP COLUMN IF EXISTS time;

-- integer 型で time カラムを再作成（分単位）
ALTER TABLE vital ADD COLUMN time integer DEFAULT 0 NOT NULL;

-- カラムにコメントを追加
COMMENT ON COLUMN vital.time IS '総学習時間（分単位）';

-- 既存ユーザーの vital.time を s_diaries から再計算して設定
UPDATE vital v
SET time = COALESCE(
  (SELECT SUM(s.time)
   FROM s_diaries s
   WHERE s.user_id = v.user_id),
  0
);