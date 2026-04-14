import { Trophy, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  score: number;
  total: number;
  onContinue: () => void;
  onRestart: () => void;
}

export default function WordOrderQuizResults({ score, total, onContinue, onRestart }: Props) {
  const pct = Math.round((score / total) * 100);

  const getMessage = () => {
    if (pct === 100) return '完璧です！素晴らしい！';
    if (pct >= 67) return 'よくできました！';
    if (pct >= 34) return 'もう少しです！練習しよう';
    return '復習してまた挑戦しよう！';
  };

  const getScoreColor = () => {
    if (pct === 100) return 'text-amber-500';
    if (pct >= 67) return 'text-emerald-600';
    if (pct >= 34) return 'text-blue-600';
    return 'text-red-500';
  };

  const getBarColor = () => {
    if (pct === 100) return 'bg-amber-400';
    if (pct >= 67) return 'bg-emerald-500';
    if (pct >= 34) return 'bg-blue-500';
    return 'bg-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-blue-100 bg-white flex flex-col items-center justify-center shadow-lg">
            <Trophy size={32} className="text-blue-400 mb-1" />
            <span className={`text-3xl font-black ${getScoreColor()}`}>{score}/{total}</span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">結果発表</h2>
          <p className="text-slate-500 text-base">{getMessage()}</p>
        </div>

        <div className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm">
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-2">正解率</p>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor()} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span className={`text-2xl font-black ${getScoreColor()}`}>{pct}%</span>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-500 text-white font-bold text-base hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            <RefreshCw size={18} />
            次の3問へ
          </button>
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-slate-600 font-bold text-base hover:bg-slate-50 active:scale-95 transition-all border border-slate-200"
          >
            <RotateCcw size={18} />
            最初に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
