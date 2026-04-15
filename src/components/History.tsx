import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { Calendar, ArrowLeft } from 'lucide-react';

interface DiaryEntry {
  id: string;
  date: string;
  s_reading: number;
  o_speaking: number;
  listening: number;
  words: number;
  ex_reading: number;
  time: number;
  self_judge: number | null;
  self_topic: string;
  one_word: string;
}

interface HistoryProps {
  onBack?: () => void;
}

export default function History({ onBack }: HistoryProps) {
  const { user } = useAuth();
  useVitalSync({ userId: user?.id });
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('s_diaries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (err: any) {
      console.error('Error fetching diary entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto p-6">
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
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">学習履歴</h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
              エラー: {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">記録がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">日付</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">リーディング</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">ライティング</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">リスニング</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">ボキャビル</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">多読</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">時間</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">自己評価</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">課題</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">ひとこと</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                          {entry.s_reading}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                          {entry.o_speaking}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                          {entry.listening}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                          {entry.words}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                          {entry.ex_reading}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                          {entry.time}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                          {entry.self_judge || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 max-w-xs truncate">
                          {entry.self_topic || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 max-w-xs truncate">
                          {entry.one_word || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
