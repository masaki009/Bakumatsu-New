import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { BookOpen, Save, ArrowLeft } from 'lucide-react';
import { formatJSTDateTimeLocale, parseJSTDateTimeLocale } from '../utils/dateUtils';

interface ExtensiveReadingLogProps {
  onBack?: () => void;
}

export default function ExtensiveReadingLog({ onBack }: ExtensiveReadingLogProps) {
  const { user } = useAuth();
  useVitalSync({ userId: user?.id });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState(() => ({
    reading_date: formatJSTDateTimeLocale(),
    words: '',
    wpm: ''
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setMessage({ type: 'error', text: 'ユーザー情報が取得できません' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const utcReadingDate = parseJSTDateTimeLocale(formData.reading_date);
      const words = parseInt(formData.words) || 0;

      const { error } = await supabase.rpc('exr_reading_rec', {
        p_user_id: user.id,
        p_email: user.email,
        p_reading_date: utcReadingDate,
        p_words: words,
        p_wpm: parseInt(formData.wpm) || 0,
        p_is_reading_aloud: false
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `多読記録を保存しました！（${words}語）`
      });

      setFormData({
        reading_date: formatJSTDateTimeLocale(),
        words: '',
        wpm: ''
      });
    } catch (error: any) {
      console.error('Error saving reading record:', error);
      setMessage({ type: 'error', text: error.message || '保存中にエラーが発生しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-2xl mx-auto p-6">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
          >
            <ArrowLeft size={18} />
            戻る
          </button>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">多読貯金</h1>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                読書日時
              </label>
              <input
                type="text"
                name="reading_date"
                value={formData.reading_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                語数
              </label>
              <input
                type="number"
                name="words"
                value={formData.words}
                onChange={handleChange}
                placeholder="読んだ語数を入力"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                WPM (Words Per Minute)
              </label>
              <input
                type="number"
                name="wpm"
                value={formData.wpm}
                onChange={handleChange}
                placeholder="読書速度を入力"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                '保存中...'
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  記録を保存
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
