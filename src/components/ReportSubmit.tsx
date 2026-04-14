import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { getJSTTimestamp, formatJSTDateLocale, parseJSTDateLocale } from '../utils/dateUtils';

type DiaryData = {
  date: string;
  s_reading: number;
  o_speaking: number;
  listening: number;
  words: number;
  ex_reading: number;
  time: number;
  self_judge: number;
  self_topic: string;
  one_word: string;
};

type ReportSubmitProps = {
  onBack: () => void;
};

export default function ReportSubmit({ onBack }: ReportSubmitProps) {
  const { userProfile } = useAuth();
  useVitalSync({ userId: userProfile?.id });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<DiaryData>({
    date: formatJSTDateLocale(),
    s_reading: 0,
    o_speaking: 0,
    listening: 0,
    words: 0,
    ex_reading: 0,
    time: 0,
    self_judge: 5,
    self_topic: '',
    one_word: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadDiaryForDate(formData.date);
  }, []);

  const loadDiaryForDate = async (selectedDate: string) => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      setSuccessMessage('');

      const dbDate = parseJSTDateLocale(selectedDate);

      const { data, error } = await supabase
        .from('s_diaries')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', dbDate)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          date: selectedDate,
          s_reading: data.s_reading || 0,
          o_speaking: data.o_speaking || 0,
          listening: data.listening || 0,
          words: data.words || 0,
          ex_reading: data.ex_reading || 0,
          time: data.time || 0,
          self_judge: data.self_judge || 5,
          self_topic: data.self_topic || '',
          one_word: data.one_word || '',
        });
        setIsEdit(true);
        setSuccessMessage('記録済みです。内容を表示します');
      } else {
        setFormData({
          ...formData,
          date: selectedDate,
          s_reading: 0,
          o_speaking: 0,
          listening: 0,
          words: 0,
          ex_reading: 0,
          time: 0,
          self_judge: 5,
          self_topic: '',
          one_word: '',
        });
        setIsEdit(false);
      }
    } catch (error) {
      console.error('Error loading diary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setFormData({ ...formData, date: newDate });
    loadDiaryForDate(newDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile?.id || !userProfile?.email) {
      alert('ユーザー情報が取得できませんでした。再度ログインしてください');
      return;
    }

    if (!formData.date) {
      alert('日付を選択してください');
      return;
    }

    if (formData.self_judge < 1 || formData.self_judge > 10) {
      alert('自己評価は1から10の範囲で選択してください');
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage('');

      // Convert locale date to YYYY-MM-DD format for database
      const dbDate = parseJSTDateLocale(formData.date);

      const { data: existingDiary } = await supabase
        .from('s_diaries')
        .select('s_reading, o_speaking, listening, words, time, ex_reading')
        .eq('user_id', userProfile.id)
        .eq('date', dbDate)
        .maybeSingle();

      const diaryData = {
        user_id: userProfile.id,
        email: userProfile.email,
        date: dbDate,
        s_reading: formData.s_reading,
        o_speaking: formData.o_speaking,
        listening: formData.listening,
        words: formData.words,
        ex_reading: existingDiary?.ex_reading ?? 0,
        time: formData.time,
        self_judge: formData.self_judge,
        self_topic: formData.self_topic,
        one_word: formData.one_word,
      };

      // Use upsert to insert or update
      const { error: upsertError } = await supabase
        .from('s_diaries')
        .upsert([diaryData], { onConflict: 'user_id,date' });

      if (upsertError) throw upsertError;

      // Calculate energy change
      const newEnergy = formData.s_reading + formData.o_speaking + formData.listening + formData.words;
      const oldEnergy = existingDiary
        ? (existingDiary.s_reading + existingDiary.o_speaking + existingDiary.listening + existingDiary.words)
        : 0;
      const energyChange = newEnergy - oldEnergy;

      // Update pre_vital energy only if there's a change
      if (energyChange !== 0) {
        const { data: preVitalData, error: preVitalFetchError } = await supabase
          .from('pre_vital')
          .select('energy')
          .eq('user_id', userProfile.id)
          .maybeSingle();

        if (preVitalFetchError) throw preVitalFetchError;

        if (preVitalData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('pre_vital')
            .update({ energy: preVitalData.energy + energyChange, updated_at: getJSTTimestamp() })
            .eq('user_id', userProfile.id);

          if (updateError) throw updateError;
        } else {
          // Create new record
          const { error: createError } = await supabase
            .from('pre_vital')
            .insert([{
              user_id: userProfile.id,
              email: userProfile.email,
              energy: newEnergy,
            }]);

          if (createError) throw createError;
        }
      }

      setSuccessMessage(isEdit ? '学習日報を更新しました' : '本日もお疲れ様でした！');
      setIsEdit(true);
    } catch (error) {
      console.error('Error saving diary:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
          >
            <ArrowLeft size={18} />
            戻る
          </button>
          <div className="flex items-center gap-3">
            <BookOpen size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">学習日報登録</h1>
              <p className="text-gray-600">今日の学習内容を記録します</p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">自動入力</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学習日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-blue-600 font-medium">
                  {isEdit ? '既存の記録を編集できます' : '新規記録を作成します'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">学習内容</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  サイマル　英和（件数）
                </label>
                <input
                  type="number"
                  value={formData.s_reading}
                  onChange={(e) => setFormData({ ...formData, s_reading: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パラフレイズ　和英（件数）
                </label>
                <input
                  type="number"
                  value={formData.o_speaking}
                  onChange={(e) => setFormData({ ...formData, o_speaking: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リスニング（チャンク）（件数）
                </label>
                <input
                  type="number"
                  value={formData.listening}
                  onChange={(e) => setFormData({ ...formData, listening: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ボキャブラリー（件数）
                </label>
                <input
                  type="number"
                  value={formData.words}
                  onChange={(e) => setFormData({ ...formData, words: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  総多読・音読数
                </label>
                <input
                  type="number"
                  value={formData.ex_reading}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">読書記録から自動反映</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学習時間（分）
                </label>
                <input
                  type="number"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">自己評価</h2>
            <p className="text-sm text-gray-600 mb-4">今日の学習の自己評価を選択してください（1-10）</p>

            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <label
                  key={rating}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.self_judge === rating
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="self_judge"
                    value={rating}
                    checked={formData.self_judge === rating}
                    onChange={(e) => setFormData({ ...formData, self_judge: parseInt(e.target.value) })}
                    className="sr-only"
                  />
                  <span className="text-lg">{rating}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">振り返り</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  課題と感じたところ
                </label>
                <textarea
                  value={formData.self_topic}
                  onChange={(e) => setFormData({ ...formData, self_topic: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="今日の学習で課題に感じたことを記録してください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ひとことログ
                </label>
                <textarea
                  value={formData.one_word}
                  onChange={(e) => setFormData({ ...formData, one_word: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="学んだこと / 感じたこと / 気づき / 成長ノート / 次の予定などを自由に記録してください"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              <Save size={24} />
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
