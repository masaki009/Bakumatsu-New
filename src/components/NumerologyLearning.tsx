import { ArrowLeft, Star } from 'lucide-react';

interface NumerologyLearningProps {
  onBack: () => void;
}

export default function NumerologyLearning({ onBack }: NumerologyLearningProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Star size={24} className="text-cyan-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">数秘術による本日の学習提案</h1>
                <p className="text-sm text-gray-600">数の力があなたの学習をサポート</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-cyan-200">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-cyan-100 rounded-full mb-4">
              <Star size={48} className="text-cyan-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">準備中</h2>
            <p className="text-gray-600">このコンポーネントの詳細は後ほど実装されます</p>
          </div>
        </div>
      </main>
    </div>
  );
}
