import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGameData } from '../hooks/useGameData';
import { useVitalSync } from '../hooks/useVitalSync';
import { supabase } from '../lib/supabase';
import { getPetStage, getTodayDate } from '../utils/gameLogic';
import { getJSTDateTime, getJSTDate } from '../utils/dateUtils';
import { Heart, Zap, Droplets, BookOpen, LogOut, ArrowLeft, Syringe, Stethoscope, Clock, Egg } from 'lucide-react';

interface DigitalPetDashboardProps {
  onBack?: () => void;
}

export default function DigitalPetDashboard({ onBack }: DigitalPetDashboardProps) {
  const { user, signOut } = useAuth();
  const { vital, preVital, loading, refreshData } = useGameData(user?.id, user?.email);
  useVitalSync({ userId: user?.id });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedAmount, setFeedAmount] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const dateStr = getJSTDate();
    return dateStr.replace(/-/g, '/');
  });
  const [lastUpdatedDateFormatted, setLastUpdatedDateFormatted] = useState('');

  useEffect(() => {
    const updateCurrentDate = () => {
      const dateStr = getJSTDate();
      setCurrentDate(dateStr.replace(/-/g, '/'));
    };

    updateCurrentDate();

    const interval = setInterval(() => {
      updateCurrentDate();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (vital) {
      const dateStr = getJSTDate();
      setCurrentDate(dateStr.replace(/-/g, '/'));

      if (vital.last_updated_date) {
        const formattedLastUpdate = vital.last_updated_date.replace(/-/g, '/');
        setLastUpdatedDateFormatted(formattedLastUpdate);
      }
    }
  }, [vital]);

  const petImages = {
    'stage-1': 'https://raw.githubusercontent.com/masaki009/bakumacchi/main/01.png',
    'stage-2': 'https://raw.githubusercontent.com/masaki009/bakumacchi/main/02.png',
    'stage-3': 'https://raw.githubusercontent.com/masaki009/bakumacchi/main/03.png',
    'stage-4': 'https://raw.githubusercontent.com/masaki009/bakumacchi/main/04.png',
    'stage-5': 'https://raw.githubusercontent.com/masaki009/bakumacchi/main/05.png',
    'stage-6': 'https://raw.githubusercontent.com/masaki009/bakumacchi/main/06.png',
  };

  if (loading || !vital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const petStage = getPetStage(vital.energy);

  const handleFeed = async () => {
    const amount = parseInt(feedAmount) || 0;
    if (amount <= 0) {
      setNotification('エネルギー量を入力してください');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!preVital || preVital.energy < amount) {
      setNotification('エネルギーが不足しています。学習して予備タンクに補給しましょう');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setActionLoading(true);
    try {
      const todayDate = getTodayDate();
      const newEnergy = vital.energy + amount;

      const { error: vitalError } = await supabase
        .from('vital')
        .update({
          energy: newEnergy,
          last_updated_date: todayDate
        })
        .eq('user_id', user!.id);

      if (vitalError) throw vitalError;

      const { error: preVitalError } = await supabase
        .from('pre_vital')
        .update({ energy: preVital.energy - amount })
        .eq('user_id', user!.id);

      if (preVitalError) throw preVitalError;

      await refreshData();
      setFeedAmount('');
      setNotification(`エネルギーが${amount}増えました！`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setNotification('エラーが発生しました');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToilet = async () => {
    if (vital.toilet === 0) {
      setNotification('トイレはきれいです');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (vital.energy < 5) {
      setNotification('エネルギーが足りません（5必要）');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setActionLoading(true);
    try {
      const todayDate = getTodayDate();
      const oldEnergy = vital.energy;
      const newEnergy = vital.energy - 5;

      const { error: updateError } = await supabase
        .from('vital')
        .update({
          toilet: 0,
          energy: newEnergy,
          last_updated_date: todayDate
        })
        .eq('user_id', user!.id);

      if (updateError) {
        throw new Error(`更新エラー: ${updateError.message}`);
      }

      await refreshData();
      setNotification(`トイレ掃除が完了しました！（エネルギー: ${oldEnergy} → ${newEnergy}）`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      setNotification(errorMessage);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMedicine = async () => {
    if (vital.sick === 0) {
      setNotification('ペットは健康です');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (vital.energy < 10) {
      setNotification('エネルギーが足りません（10必要）');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setActionLoading(true);
    try {
      const todayDate = getTodayDate();
      const oldEnergy = vital.energy;
      const oldSick = vital.sick;
      const newSick = Math.max(0, vital.sick - 1);
      const newEnergy = vital.energy - 10;

      const { error: updateError } = await supabase
        .from('vital')
        .update({
          sick: newSick,
          energy: newEnergy,
          last_updated_date: todayDate
        })
        .eq('user_id', user!.id);

      if (updateError) {
        throw new Error(`更新エラー: ${updateError.message}`);
      }

      await refreshData();
      setNotification(`治療が完了しました！（エネルギー: ${oldEnergy} → ${newEnergy}、病気: ${oldSick} → ${newSick}）`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      setNotification(errorMessage);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleSignOut = () => {
    signOut();
  };

  const getStageLabel = (stage: string) => {
    const stageMap: { [key: string]: string } = {
      'stage-1': 'STAGE 1',
      'stage-2': 'STAGE 2',
      'stage-3': 'STAGE 3: YOUNG CHICK',
      'stage-4': 'STAGE 4',
      'stage-5': 'STAGE 5',
      'stage-6': 'STAGE 6',
    };
    return stageMap[stage] || stage;
  };

  const formatTime = (minutes: number | undefined) => {
    if (!minutes || isNaN(minutes)) return '0時間0分';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}時間${mins}分`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {notification}
        </div>
      )}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                メニューに戻る
              </button>
            )}
            <Egg className="w-10 h-10 text-yellow-600" />
            <h1 className="text-xl font-bold text-gray-900">私のばくまっち</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl p-8 aspect-square flex flex-col items-center justify-center">
                <img
                  src={petImages[petStage as keyof typeof petImages]}
                  alt="Pet"
                  className="w-48 h-48 object-contain mb-4 animate-bounce"
                />
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {getStageLabel(petStage)}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">メール</span>
                  <span className="text-gray-900 font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">現在の日付</span>
                  <span className="text-gray-900 font-medium">
                    {currentDate}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">最終更新日</span>
                  <span className="text-gray-900 font-medium">{lastUpdatedDateFormatted}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">バイタルステータス</h3>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-700">エネルギー</span>
                    </div>
                    <span className="text-2xl font-bold text-green-700">{vital.energy}</span>
                  </div>
                  {preVital && (
                    <p className="text-xs text-gray-600 mt-1">
                      予備エネルギー: {preVital.energy}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-gray-700">トイレ</span>
                  </div>
                  {vital.toilet > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: vital.toilet }).map((_, i) => (
                        <span key={i} className="text-2xl">💩</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-pink-600" />
                    <span className="font-medium text-gray-700">病気</span>
                  </div>
                  {vital.sick > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: vital.sick }).map((_, i) => (
                        <Syringe key={i} className="w-6 h-6 text-pink-600" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-700">総多読語数</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{vital.readbooks}語</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-700">総学習時間</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-700">{formatTime(vital.time)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">アクション</h3>

                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    value={feedAmount}
                    onChange={(e) => setFeedAmount(e.target.value)}
                    placeholder="エネルギー量"
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                  />
                  <button
                    onClick={handleFeed}
                    disabled={actionLoading}
                    className="w-1/2 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    給餌
                  </button>
                </div>

                <button
                  onClick={handleToilet}
                  disabled={actionLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                >
                  <Droplets className="w-5 h-5" />
                  トイレ掃除 (5エネルギー)
                </button>

                <button
                  onClick={handleMedicine}
                  disabled={actionLoading}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Syringe className="w-5 h-5" />
                  治療 (10エネルギー)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
