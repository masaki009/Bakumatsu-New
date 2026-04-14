import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Heart, TrendingUp, Award, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { supabase } from '../lib/supabase';
import { getTodayDate } from '../utils/gameLogic';
import 'animate.css';

interface BakumatchiProps {
  onBack: () => void;
}

export default function Bakumatchi({ onBack }: BakumatchiProps) {
  const { userProfile } = useAuth();
  useVitalSync({ userId: userProfile?.id });
  const [loading, setLoading] = useState(true);
  const [energy, setEnergy] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState('animate__bounce');
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    fetchEnergy();
  }, [userProfile]);

  useEffect(() => {
    const animations = [
      'animate__bounce',
      'animate__flip',
      'animate__rotateIn',
      'animate__shakeX',
      'animate__swing',
      'animate__wobble',
      'animate__jello',
      'animate__heartBeat',
      'animate__rubberBand',
      'animate__tada',
      'animate__pulse'
    ];

    const interval = setInterval(() => {
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setCurrentAnimation(randomAnimation);
      setAnimationKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchEnergy = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pre_vital')
        .select('energy')
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEnergy(data.energy || 0);
      }

      const { data: vitalData, error: vitalError } = await supabase
        .from('vital')
        .select('time')
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      if (vitalError) throw vitalError;

      if (vitalData) {
        setTotalStudyTime(vitalData.time || 0);
      }
    } catch (error) {
      console.error('Error fetching energy:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStudyTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}時間${mins}分`;
  };

  const getPetStatus = () => {
    if (energy < 50) {
      return {
        level: 'たまご',
        emoji: '🥚',
        message: 'まだまだこれから！学習を続けよう',
        color: 'from-gray-100 to-gray-200',
        borderColor: 'border-gray-300',
      };
    } else if (energy < 150) {
      return {
        level: 'ひよこ',
        emoji: '🐣',
        message: '順調に成長中！',
        color: 'from-yellow-100 to-yellow-200',
        borderColor: 'border-yellow-300',
      };
    } else if (energy < 300) {
      return {
        level: 'にわとり',
        emoji: '🐤',
        message: 'いい調子！継続が大事',
        color: 'from-orange-100 to-orange-200',
        borderColor: 'border-orange-300',
      };
    } else if (energy < 500) {
      return {
        level: 'すずめ',
        emoji: '🐦',
        message: '素晴らしい成長！',
        color: 'from-blue-100 to-blue-200',
        borderColor: 'border-blue-300',
      };
    } else if (energy < 800) {
      return {
        level: 'はと',
        emoji: '🕊️',
        message: '上級者の仲間入り！',
        color: 'from-cyan-100 to-cyan-200',
        borderColor: 'border-cyan-300',
      };
    } else if (energy < 1200) {
      return {
        level: 'わし',
        emoji: '🦅',
        message: '圧倒的な学習量！',
        color: 'from-green-100 to-green-200',
        borderColor: 'border-green-300',
      };
    } else {
      return {
        level: 'ほうおう',
        emoji: '🔥',
        message: '伝説のレベルに到達！',
        color: 'from-purple-100 to-pink-200',
        borderColor: 'border-purple-300',
      };
    }
  };

  const getProgressPercentage = () => {
    const milestones = [50, 150, 300, 500, 800, 1200];
    let currentMilestone = 0;
    let nextMilestone = 50;

    for (let i = 0; i < milestones.length; i++) {
      if (energy >= milestones[i]) {
        currentMilestone = milestones[i];
        nextMilestone = milestones[i + 1] || 1200;
      } else {
        break;
      }
    }

    if (energy >= 1200) {
      return 100;
    }

    const progress = ((energy - currentMilestone) / (nextMilestone - currentMilestone)) * 100;
    return Math.min(progress, 100);
  };

  const getNextLevelEnergy = () => {
    const milestones = [50, 150, 300, 500, 800, 1200];
    for (const milestone of milestones) {
      if (energy < milestone) {
        return milestone;
      }
    }
    return null;
  };

  const petStatus = getPetStatus();
  const progressPercentage = getProgressPercentage();
  const nextLevelEnergy = getNextLevelEnergy();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ばくまっち - BK Digital Pet</h1>
              <p className="text-sm text-gray-600">あなたの学習パートナー</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className={`bg-gradient-to-br ${petStatus.color} rounded-2xl p-8 border-4 ${petStatus.borderColor} shadow-xl`}>
            <div className="text-center">
              <div className="mb-6">
                <div
                  key={animationKey}
                  className={`text-9xl mb-4 animate__animated ${currentAnimation}`}
                >
                  {petStatus.emoji}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{petStatus.level}</h2>
                <p className="text-lg text-gray-700">{petStatus.message}</p>
              </div>

              <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="text-yellow-500" size={24} />
                  <span className="text-2xl font-bold text-gray-900">エネルギー: {energy}</span>
                </div>

                {nextLevelEnergy && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>次のレベルまで</span>
                      <span className="font-semibold">{nextLevelEnergy - energy} エネルギー</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Heart className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">現在のレベル</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{petStatus.level}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">累積エネルギー</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{energy}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-yellow-200 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="text-yellow-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">次の目標</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {nextLevelEnergy ? `${nextLevelEnergy}` : '最高レベル！'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-pink-200 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Clock className="text-pink-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">総学習時間</h3>
              </div>
              <p className="text-3xl font-bold text-pink-600">{formatStudyTime(totalStudyTime)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">成長の軌跡</h3>
            <div className="space-y-3">
              {[
                { level: 'たまご', energy: 0, emoji: '🥚' },
                { level: 'ひよこ', energy: 50, emoji: '🐣' },
                { level: 'にわとり', energy: 150, emoji: '🐤' },
                { level: 'すずめ', energy: 300, emoji: '🐦' },
                { level: 'はと', energy: 500, emoji: '🕊️' },
                { level: 'わし', energy: 800, emoji: '🦅' },
                { level: 'ほうおう', energy: 1200, emoji: '🔥' },
              ].map((milestone, index) => {
                const isCompleted = energy >= milestone.energy;
                const isCurrent = index > 0 && energy >= milestone.energy && energy < ([50, 150, 300, 500, 800, 1200][index] || Infinity);

                return (
                  <div
                    key={milestone.level}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : isCompleted
                        ? 'bg-green-50 border-2 border-green-300'
                        : 'bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <span className={`text-4xl ${isCompleted ? '' : 'opacity-30'}`}>{milestone.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {milestone.level}
                      </p>
                      <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                        {milestone.energy} エネルギー
                      </p>
                    </div>
                    {isCompleted && (
                      <div className="text-green-600">
                        <Award size={24} />
                      </div>
                    )}
                    {isCurrent && (
                      <div className="text-blue-600 font-semibold text-sm">現在</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">エネルギーの獲得方法</h3>
            <p className="text-gray-700 mb-3">
              日報登録で以下の活動を記録すると、エネルギーが貯まります：
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>英和（件数）</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>和英（件数）</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>リスニング（チャンク）（件数）</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>ボキャブラリー（件数）</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
