/*
  # 関数検索パスの最終修正

  ## 修正内容
  1. 古い`exr_reading_rec`関数を削除
  2. 正しい`search_path`設定を持つ関数のみを保持
  
  ## セキュリティ
  - 関数に`SET search_path = ''`を設定してセキュリティを強化
*/

-- 古い exr_reading_rec 関数を削除（パラメータが異なるバージョン）
DROP FUNCTION IF EXISTS public.exr_reading_rec(uuid, text, timestamp with time zone, integer, integer, boolean);

-- 正しい関数が存在することを確認し、必要に応じて再作成
CREATE OR REPLACE FUNCTION public.exr_reading_rec(
  p_user_id uuid,
  p_read_date date,
  p_book_title text,
  p_word_count integer DEFAULT NULL,
  p_is_reading_aloud boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_vital_record RECORD;
BEGIN
  INSERT INTO public.ex_reading (user_id, read_date, book_title, word_count, is_reading_aloud)
  VALUES (p_user_id, p_read_date, p_book_title, p_word_count, p_is_reading_aloud);

  SELECT * INTO v_vital_record
  FROM public.vital
  WHERE user_id = p_user_id AND date = p_read_date;

  IF FOUND THEN
    UPDATE public.vital
    SET 
      extensive_reading = true,
      pet_exp = pet_exp + 10,
      pet_affection = LEAST(pet_affection + 5, 100)
    WHERE user_id = p_user_id AND date = p_read_date;
  ELSE
    INSERT INTO public.vital (
      user_id,
      date,
      extensive_reading,
      pet_exp,
      pet_affection
    ) VALUES (
      p_user_id,
      p_read_date,
      true,
      10,
      5
    );
  END IF;
END;
$$;