/*
  # 音読フラグをex_readingテーブルに追加

  1. 変更内容
    - `ex_reading`テーブルに`is_reading_aloud` (boolean)カラムを追加
    - デフォルト値: false
    - 音読練習の場合はtrue、多読速読の場合はfalseとして記録
  
  2. 目的
    - 音読練習と多読速読チャレンジを区別するためのフラグ
    - 統計やレポート作成時に活動タイプを識別可能にする
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ex_reading' AND column_name = 'is_reading_aloud'
  ) THEN
    ALTER TABLE ex_reading ADD COLUMN is_reading_aloud boolean DEFAULT false;
  END IF;
END $$;