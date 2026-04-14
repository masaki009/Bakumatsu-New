import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateFourPillars, ElementBalance } from '../utils/fourPillars';
import { generateFourPillarsAdvice } from '../utils/fourPillarsAdvice';

interface SelfProfile {
  birth: string;
  name: string;
}

interface LearningAdviceItem {
  title: string;
  description: string;
}

interface LuckyActivity {
  rating: number;
  comment: string;
}

interface LuckyActivities {
  reading: LuckyActivity;
  writing: LuckyActivity;
  listening: LuckyActivity;
  speaking: LuckyActivity;
  vocabulary: LuckyActivity;
  grammar: LuckyActivity;
  conversation: LuckyActivity;
}

interface AdviceData {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  todayPillar: string;
  elementBalance: ElementBalance;
  todayEnergy: string;
  learningAdvice: LearningAdviceItem[];
  cautions: string;
  luckyActivities: LuckyActivities;
}

interface FourPillarsLearningProps {
  onBack: () => void;
}

export default function FourPillarsLearning({ onBack }: FourPillarsLearningProps) {
  const { user } = useAuth();
  const [selfProfile, setSelfProfile] = useState<SelfProfile | null>(null);
  const [birthTime, setBirthTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [adviceData, setAdviceData] = useState<AdviceData | null>(null);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  useEffect(() => {
    loadProfile();
    checkTodayAdvice();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('self_profiles')
        .select('birth, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSelfProfile(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAdvice = async () => {
    if (!user) return;

    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('four_pillars_advice')
        .select('*')
        .eq('user_id', user.id)
        .eq('advice_date', todayDate)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBirthTime(data.birth_time);
        setAdviceData({
          yearPillar: data.year_pillar,
          monthPillar: data.month_pillar,
          dayPillar: data.day_pillar,
          todayPillar: data.today_pillar,
          elementBalance: data.element_balance as ElementBalance,
          todayEnergy: data.today_energy,
          learningAdvice: data.learning_advice as LearningAdviceItem[],
          cautions: data.cautions,
          luckyActivities: data.lucky_activities as LuckyActivities,
        });
        setShowResult(true);
      }
    } catch (err) {
      console.error('Error checking today advice:', err);
    }
  };

  const generateAdvice = async () => {
    if (!selfProfile?.birth || !birthTime) {
      setError('生年月日と生まれた時間を入力してください');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const birthDate = new Date(selfProfile.birth);
      const todayDate = new Date();

      const result = calculateFourPillars(birthDate, birthTime, todayDate);
      const advice = generateFourPillarsAdvice(result.elementBalance, result.todayPillar, selfProfile.name);

      const newAdviceData: AdviceData = {
        yearPillar: result.yearPillar,
        monthPillar: result.monthPillar,
        dayPillar: result.dayPillar,
        todayPillar: result.todayPillar,
        elementBalance: result.elementBalance,
        todayEnergy: advice.todayEnergy,
        learningAdvice: advice.learningAdvice,
        cautions: advice.cautions,
        luckyActivities: advice.luckyActivities,
      };

      await supabase
        .from('four_pillars_advice')
        .upsert({
          user_id: user!.id,
          advice_date: todayDate.toISOString().split('T')[0],
          birth_time: birthTime,
          year_pillar: result.yearPillar,
          month_pillar: result.monthPillar,
          day_pillar: result.dayPillar,
          today_pillar: result.todayPillar,
          element_balance: result.elementBalance,
          today_energy: advice.todayEnergy,
          learning_advice: advice.learningAdvice,
          cautions: advice.cautions,
          lucky_activities: advice.luckyActivities,
        });

      setAdviceData(newAdviceData);
      setShowResult(true);
    } catch (err) {
      console.error('Error generating advice:', err);
      setError('アドバイスの生成中にエラーが発生しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleBackToInput = () => {
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (showResult && adviceData) {
    const elements = [
      { name: '木', value: adviceData.elementBalance.木, color: 'bg-green-500' },
      { name: '火', value: adviceData.elementBalance.火, color: 'bg-red-500' },
      { name: '土', value: adviceData.elementBalance.土, color: 'bg-yellow-500' },
      { name: '金', value: adviceData.elementBalance.金, color: 'bg-gray-500' },
      { name: '水', value: adviceData.elementBalance.水, color: 'bg-blue-500' },
    ];

    const maxElement = Math.max(...elements.map(e => e.value));

    const activities = [
      { key: 'reading', label: 'リーディング', icon: '📖' },
      { key: 'writing', label: 'ライティング', icon: '✍️' },
      { key: 'listening', label: 'リスニング', icon: '👂' },
      { key: 'speaking', label: 'スピーキング', icon: '🗣️' },
      { key: 'vocabulary', label: '単語', icon: '📝' },
      { key: 'grammar', label: '文法', icon: '📚' },
      { key: 'conversation', label: '会話', icon: '💬' },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToInput}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                戻る
              </button>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-purple-600" size={24} />
                四柱推命学習アドバイス
              </h1>
              <div className="w-24"></div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-gray-900">{selfProfile?.name || 'あなた'}さん</p>
              <p className="text-gray-600">{today}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">生年月日：</span>
                <span className="font-medium">{selfProfile?.birth}</span>
              </div>
              <div>
                <span className="text-gray-600">生まれた時間：</span>
                <span className="font-medium">{birthTime}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">四柱（命式）</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">年柱</p>
                <p className="text-2xl font-bold text-gray-900">{adviceData.yearPillar}</p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">月柱</p>
                <p className="text-2xl font-bold text-gray-900">{adviceData.monthPillar}</p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">日柱</p>
                <p className="text-2xl font-bold text-gray-900">{adviceData.dayPillar}</p>
              </div>
              <div className="border-2 border-purple-500 bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-700 mb-2 font-semibold">今日の日柱</p>
                <p className="text-2xl font-bold text-purple-900">{adviceData.todayPillar}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">五行バランス</h2>
            <div className="space-y-4">
              {elements.map((element) => (
                <div key={element.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{element.name}</span>
                    <span className="text-sm text-gray-600">{element.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`${element.color} h-4 rounded-full transition-all duration-500`}
                      style={{ width: `${(element.value / maxElement) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={24} />
              今日の干支エネルギー
            </h2>
            <p className="text-gray-800 leading-relaxed">{adviceData.todayEnergy}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">今日の英語学習アドバイス</h2>
            <div className="space-y-4">
              {adviceData.learningAdvice.map((advice, index) => (
                <div key={index} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h3 className="font-bold text-gray-900 mb-2">{advice.title}</h3>
                  <p className="text-gray-700">{advice.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-orange-900 mb-3">注意点</h2>
            <p className="text-gray-800 leading-relaxed">{adviceData.cautions}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="text-yellow-500" size={24} />
              今日のラッキー英語学習
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity) => {
                const data = adviceData.luckyActivities[activity.key as keyof LuckyActivities];
                return (
                  <div key={activity.key} className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{activity.icon}</span>
                      <h3 className="font-bold text-gray-900">{activity.label}</h3>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={star <= data.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">{data.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={24} />
              四柱推命学習アドバイス
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-gray-900 mb-2">{selfProfile?.name || 'あなた'}さん</p>
          <p className="text-lg text-gray-600">{today}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">生年月日</label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
              <p className="text-gray-900 font-medium">{selfProfile?.birth || '未設定'}</p>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生まれた時間を入力してください
            </label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="HH:mm"
            />
            <p className="mt-1 text-sm text-gray-500">例：09:30</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={generateAdvice}
            disabled={generating || !birthTime}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                アドバイスを生成中...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                今日のアドバイスを見る
              </>
            )}
          </button>

          {!selfProfile?.birth && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                生年月日が設定されていません。セルフ設定から登録してください。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
