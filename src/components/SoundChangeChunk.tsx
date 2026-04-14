import { useState } from 'react';
import { ArrowLeft, Zap, ChevronRight, ChevronLeft, Loader2, Volume2, Film } from 'lucide-react';

type SoundChangeType = '脱落・弱化' | '同化' | 'リンキング' | '短縮形' | 'ミックス';

interface Chunk {
  original: string;
  phonetic: string;
  rule: string;
}

interface SoundChangeExample {
  type: string;
  sentence: string;
  spokenForm?: string;
  source: string | null;
  translation: string;
  chunks: Chunk[];
  miniLecture: string;
  batchStart: number;
  batchSize: number;
}

const TYPES: SoundChangeType[] = ['脱落・弱化', '同化', 'リンキング', '短縮形', 'ミックス'];

const TYPE_COLORS: Record<SoundChangeType, string> = {
  '脱落・弱化': 'bg-orange-100 text-orange-700 border-orange-300',
  '同化':       'bg-blue-100 text-blue-700 border-blue-300',
  'リンキング': 'bg-teal-100 text-teal-700 border-teal-300',
  '短縮形':     'bg-rose-100 text-rose-700 border-rose-300',
  'ミックス':   'bg-violet-100 text-violet-700 border-violet-300',
};

const TYPE_SELECTED: Record<SoundChangeType, string> = {
  '脱落・弱化': 'bg-orange-500 text-white border-orange-500',
  '同化':       'bg-blue-500 text-white border-blue-500',
  'リンキング': 'bg-teal-500 text-white border-teal-500',
  '短縮形':     'bg-rose-500 text-white border-rose-500',
  'ミックス':   'bg-violet-500 text-white border-violet-500',
};

interface Props {
  onBack?: () => void;
}

function speakEnglish(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

export default function SoundChangeChunk({ onBack }: Props) {
  const [selectedType, setSelectedType] = useState<SoundChangeType>('同化');
  const [history, setHistory] = useState<SoundChangeExample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const current = currentIndex >= 0 ? history[currentIndex] : null;

  const positionInBatch = current ? currentIndex - current.batchStart + 1 : 0;
  const batchTotal = current ? current.batchSize : 3;

  const fetchExamples = async () => {
    setLoading(true);
    setError(null);
    setShowTranslation(false);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const usedSentences = history.map(e => e.sentence);

      const res = await fetch(`${supabaseUrl}/functions/v1/sound-change-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ type: selectedType, usedSentences }),
      });

      const data = await res.json();

      if (!res.ok || !data.examples) {
        throw new Error(data.error || '例文の生成に失敗しました');
      }

      const rawExamples = data.examples as Omit<SoundChangeExample, 'batchStart' | 'batchSize'>[];

      setHistory(prev => {
        const batchStart = prev.length;
        const batchSize = rawExamples.length;
        const newExamples: SoundChangeExample[] = rawExamples.map(e => ({ ...e, batchStart, batchSize }));
        setCurrentIndex(batchStart);
        return [...prev, ...newExamples];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '例文の生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setShowTranslation(false);
    if (currentIndex < history.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      fetchExamples();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowTranslation(false);
      setCurrentIndex(i => i - 1);
    }
  };

  const chipBase = 'px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all duration-150 cursor-pointer select-none';
  const typeColor = (t: string) => TYPE_COLORS[t as SoundChangeType] ?? 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Volume2 className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-bold text-gray-900 text-lg">音変化チャンク</span>
          </div>
        </div>

        {/* Chips + Generate button on same row */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center gap-2 flex-wrap">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`${chipBase} ${selectedType === t ? TYPE_SELECTED[t] + ' shadow-md scale-105' : TYPE_COLORS[t] + ' opacity-70 hover:opacity-100'}`}
            >
              {t}
            </button>
          ))}
          <div className="flex-1 min-w-[8px]" />
          <button
            onClick={fetchExamples}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all duration-150 whitespace-nowrap"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            例文を生成する
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 h-36" />
            ))}
          </div>
        )}

        {!loading && current && (
          <>
            {/* Sentence card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-5">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${typeColor(current.type)}`}>
                    {current.type}
                  </span>
                  {current.source && (
                    <span className="flex items-center gap-1 px-3 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium">
                      <Film className="h-3 w-3" />
                      {current.source}
                    </span>
                  )}
                </div>

                {/* Sentence */}
                <p className="text-2xl font-bold text-gray-900 leading-relaxed mb-1">{current.sentence}</p>
                {/* Translation toggle + audio */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setShowTranslation(v => !v)}
                    className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
                  >
                    {showTranslation ? '和訳を隠す' : '和訳を表示'}
                  </button>
                  <button
                    onClick={() => speakEnglish(current.sentence)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    音声
                  </button>
                </div>

                {showTranslation && (
                  <p className="mt-2 text-base text-gray-600 font-medium">{current.translation}</p>
                )}
              </div>
            </div>

            {/* Chunks table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 pt-4 pb-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">音変化チャンク</p>
              </div>
              <div className="divide-y divide-gray-100">
                {current.chunks.map((chunk, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4 flex-wrap">
                    <span className="font-mono font-bold text-gray-800 min-w-[120px]">{chunk.original}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-blue-600 font-bold text-lg min-w-[80px]">{chunk.phonetic}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg font-mono">{chunk.rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini lecture */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 pt-4 pb-2 border-b border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">ミニレクチャー</p>
              </div>
              <p className="px-6 py-4 text-sm text-slate-700 leading-relaxed">{current.miniLecture}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold rounded-xl transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                前へ
              </button>

              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-gray-400 disabled:opacity-40 text-gray-700 text-sm font-semibold rounded-xl transition-all"
              >
                次へ
                <ChevronRight className="h-4 w-4" />
              </button>

              <span className="text-sm font-bold text-gray-400 tabular-nums">
                {positionInBatch} / {batchTotal}
              </span>
            </div>
          </>
        )}

        {!loading && !current && !error && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 bg-blue-50 rounded-full mb-4">
              <Volume2 className="h-10 w-10 text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm">音変化の種類を選んで「例文を生成する」を押してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
