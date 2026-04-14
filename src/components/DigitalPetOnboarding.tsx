import { useState } from 'react';
import { Sparkles, Heart, BookOpen, Trophy } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => Promise<void>;
}

export default function DigitalPetOnboarding({ onComplete }: OnboardingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await onComplete();
    } catch (error) {
      console.error('Failed to initialize:', error);
      const errorMessage = error instanceof Error ? error.message : '初期化に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ようこそ、デジタルペットばくまっちへ！
          </h1>
          <p className="text-lg text-gray-600">
            学習で育てるペットゲームです
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">学習でエネルギーを獲得</h3>
              <p className="text-sm text-gray-600">
                読書や学習活動をすることでペットのエネルギーが増えます
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">ペットのお世話</h3>
              <p className="text-sm text-gray-600">
                トイレや病気の管理も大切です。定期的にチェックしましょう
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-cyan-50 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">ペットが成長</h3>
              <p className="text-sm text-gray-600">
                エネルギーが増えるとペットが成長していきます
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>初期化中...</span>
            </div>
          ) : (
            'ペットを始める'
          )}
        </button>
      </div>
    </div>
  );
}
