import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { BookOpen, Save, ArrowLeft, Sprout, TreePine, Award, Trophy, Star, Gem, Crown } from 'lucide-react';
import { formatJSTDateLocale, parseJSTDateLocale } from '../utils/dateUtils';

interface ExtensiveReadingLogProps {
  onBack?: () => void;
}

interface BadgeLevel {
  min: number;
  max: number;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  progressColor: string;
  Icon: React.ElementType;
}

const BADGE_LEVELS: BadgeLevel[] = [
  { min: 0,       max: 9999,    label: 'ビギナー',         color: 'text-gray-600',   bgColor: 'bg-gray-50',    borderColor: 'border-gray-300',  progressColor: 'bg-gray-400',   Icon: Sprout   },
  { min: 10000,   max: 49999,   label: 'ブックウォーム',   color: 'text-green-700',  bgColor: 'bg-green-50',   borderColor: 'border-green-300', progressColor: 'bg-green-500',  Icon: TreePine },
  { min: 50000,   max: 99999,   label: 'リーダー',         color: 'text-blue-700',   bgColor: 'bg-blue-50',    borderColor: 'border-blue-300',  progressColor: 'bg-blue-500',   Icon: Star     },
  { min: 100000,  max: 199999,  label: '多読マスター',     color: 'text-amber-700',  bgColor: 'bg-amber-50',   borderColor: 'border-amber-300', progressColor: 'bg-amber-500',  Icon: Award    },
  { min: 200000,  max: 499999,  label: '多読チャンピオン', color: 'text-orange-700', bgColor: 'bg-orange-50',  borderColor: 'border-orange-300',progressColor: 'bg-orange-500', Icon: Trophy   },
  { min: 500000,  max: 999999,  label: '多読エキスパート', color: 'text-rose-700',   bgColor: 'bg-rose-50',    borderColor: 'border-rose-300',  progressColor: 'bg-rose-500',   Icon: Gem      },
  { min: 1000000, max: Infinity, label: '多読レジェンド',  color: 'text-violet-700', bgColor: 'bg-violet-50',  borderColor: 'border-violet-300',progressColor: 'bg-violet-500', Icon: Crown    },
];

function getBadge(total: number): BadgeLevel {
  return BADGE_LEVELS.findLast(b => total >= b.min) ?? BADGE_LEVELS[0];
}

export default function ExtensiveReadingLog({ onBack }: ExtensiveReadingLogProps) {
  const { user } = useAuth();
  useVitalSync({ userId: user?.id });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [readingTotal, setReadingTotal] = useState<number | null>(null);

  const [formData, setFormData] = useState(() => ({
    reading_date: formatJSTDateLocale(),
    words: '',
    vocab: '',
  }));

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('ex_reading')
      .select('reading_total')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setReadingTotal(data?.reading_total ?? 0));
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setMessage({ type: 'error', text: 'ユーザー情報が取得できません' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const readingDate = parseJSTDateLocale(formData.reading_date);
      const words = parseInt(formData.words) || 0;

      const { error } = await supabase.rpc('exr_reading_rec', {
        p_user_id: user.id,
        p_email: user.email,
        p_reading_date: readingDate,
        p_words: words,
        p_wpm: 0,
        p_is_reading_aloud: false
      });

      if (error) throw error;

      setReadingTotal(prev => (prev ?? 0) + words);
      setMessage({
        type: 'success',
        text: `多読記録を保存しました！（${words}語）`
      });

      setFormData({
        reading_date: formatJSTDateLocale(),
        words: '',
        vocab: '',
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const currentTotal = readingTotal ?? 0;
  const badge = getBadge(currentTotal);

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

        {/* バッジカード */}
        <div className={`mb-5 rounded-2xl border-2 ${badge.borderColor} ${badge.bgColor} p-6 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${badge.bgColor} border ${badge.borderColor}`}>
                <badge.Icon className={`w-7 h-7 ${badge.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">現在のバッジ</p>
                <p className={`text-xl font-bold ${badge.color}`}>{badge.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">総多読語数</p>
              <p className={`text-3xl font-extrabold ${badge.color} tabular-nums`}>
                {readingTotal === null ? '---' : currentTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">語</p>
            </div>
          </div>

          {/* バッジ一覧 */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {BADGE_LEVELS.map((b) => {
              const unlocked = currentTotal >= b.min;
              return (
                <div
                  key={b.label}
                  title={`${b.label}（${b.min.toLocaleString()}語〜）`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all
                    ${unlocked ? `${b.bgColor} ${b.borderColor} ${b.color}` : 'bg-gray-100 border-gray-200 text-gray-400 opacity-50'}`}
                >
                  <b.Icon size={12} />
                  {b.label}
                </div>
              );
            })}
          </div>
        </div>

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                読書日
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
                placeholder="今回読んだ語数を入力"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                単語数
                <span className="ml-2 text-xs font-normal text-gray-400">（新しく覚えた単語）</span>
              </label>
              <input
                type="number"
                name="vocab"
                value={formData.vocab}
                onChange={handleChange}
                placeholder="覚えた単語数を入力（任意）"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
