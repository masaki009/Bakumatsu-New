import { useState, useEffect } from 'react';
import { ArrowLeft, Droplet, Star, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateBloodTypeAdvice, getWeekOfMonth } from '../utils/bloodTypeAdvice';

interface SelfProfile {
  name: string;
}

interface AdviceData {
  weekOfMonth: number;
  weekName: string;
  advice: string;
  encouragement: string;
  learningTips: string[];
  luckyActivity: string;
}

interface BloodTypeLearningProps {
  onBack: () => void;
}

export default function BloodTypeLearning({ onBack }: BloodTypeLearningProps) {
  const { user } = useAuth();
  const [selfProfile, setSelfProfile] = useState<SelfProfile | null>(null);
  const [bloodType, setBloodType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [adviceData, setAdviceData] = useState<AdviceData | null>(null);

  const today = new Date();
  const todayString = today.toLocaleDateString('ja-JP', {
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
        .select('name')
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
        .from('blood_type_advice')
        .select('*')
        .eq('user_id', user.id)
        .eq('advice_date', todayDate)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBloodType(data.blood_type);
        setAdviceData({
          weekOfMonth: data.week_of_month,
          weekName: data.week_name,
          advice: data.advice,
          encouragement: data.encouragement,
          learningTips: data.learning_tips as string[],
          luckyActivity: data.lucky_activity,
        });
        setShowResult(true);
      }
    } catch (err) {
      console.error('Error checking today advice:', err);
    }
  };

  const generateAdvice = async (selectedBloodType: string) => {
    if (!selectedBloodType) return;

    setBloodType(selectedBloodType);

    const result = generateBloodTypeAdvice(selectedBloodType, today);

    const newAdviceData: AdviceData = {
      weekOfMonth: result.weekOfMonth,
      weekName: result.weekName,
      advice: result.advice,
      encouragement: result.encouragement,
      learningTips: result.learningTips,
      luckyActivity: result.luckyActivity,
    };

    try {
      await supabase
        .from('blood_type_advice')
        .upsert({
          user_id: user!.id,
          advice_date: today.toISOString().split('T')[0],
          blood_type: selectedBloodType,
          week_of_month: result.weekOfMonth,
          week_name: result.weekName,
          advice: result.advice,
          encouragement: result.encouragement,
          learning_tips: result.learningTips,
          lucky_activity: result.luckyActivity,
        });

      setAdviceData(newAdviceData);
      setShowResult(true);
    } catch (err) {
      console.error('Error saving advice:', err);
    }
  };

  const handleBackToInput = () => {
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (showResult && adviceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToInput}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                戻る
              </button>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Droplet className="text-red-600" size={24} />
                血液型週間学習アドバイス
              </h1>
              <div className="w-20"></div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-gray-900">{selfProfile?.name || 'あなた'}さん</p>
              <p className="text-gray-600">{todayString}</p>
            </div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <span className="text-gray-600">血液型：</span>
                <span className="font-bold text-red-600 text-lg">{bloodType}型</span>
              </div>
              <div>
                <span className="text-gray-600">今月：</span>
                <span className="font-medium">{adviceData.weekName}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-xl shadow-lg p-6 mb-6 border-2 border-red-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="text-red-600" size={24} />
              今週の学習アドバイス
            </h2>
            <p className="text-gray-800 leading-relaxed mb-4">{adviceData.advice}</p>
            <div className="bg-white/80 rounded-lg p-4 border border-red-200">
              <p className="text-red-800 font-medium flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                {adviceData.encouragement}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" size={24} />
              おすすめ学習ポイント
            </h2>
            <div className="space-y-3">
              {adviceData.learningTips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 pt-1">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 rounded-xl shadow-lg p-6 border-2 border-yellow-300">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="text-yellow-600 fill-yellow-600" size={24} />
              今週のラッキー学習
            </h2>
            <div className="bg-white/90 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-red-600 mb-2">{adviceData.luckyActivity}</p>
              <p className="text-gray-700">この活動を重点的に行うと、特に効果的です！</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
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
              <Droplet className="text-red-600" size={24} />
              血液型週間学習アドバイス
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-gray-900 mb-2">{selfProfile?.name || 'あなた'}さん</p>
          <p className="text-lg text-gray-600 mb-1">{todayString}</p>
          <p className="text-sm text-gray-500">今月 第{getWeekOfMonth(today)}週</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <Droplet size={48} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">血液型を選択してください</h2>
            <p className="text-gray-600 text-sm">
              あなたの血液型と今週の運気から、最適な学習アドバイスを提供します
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {['A', 'B', 'O', 'AB'].map((type) => (
              <button
                key={type}
                onClick={() => generateAdvice(type)}
                className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white p-8 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                <div className="relative">
                  <Droplet size={32} className="mx-auto mb-3" />
                  <p className="text-3xl font-bold mb-1">{type}型</p>
                  <p className="text-sm text-white/80">タップして選択</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              選択した血液型と今週の情報から、あなたに最適な学習アドバイスを生成します
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
