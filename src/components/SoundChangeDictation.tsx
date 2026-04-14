import { useState } from 'react';
import { ArrowLeft, Volume2, Loader2, CheckCircle, XCircle, RotateCcw, ChevronRight, Mic } from 'lucide-react';

type SoundChangeType = '脱落・弱化' | '同化' | 'リンキング' | '短縮形' | 'ミックス';
type Level = '初級' | '中級' | '上級';
type Speed = 0.7 | 1.0 | 1.2;

interface SoundChange {
  phrase: string;
  phonetic: string;
  rule: string;
}

interface DictationQuestion {
  sentence: string;
  translation: string;
  soundChanges: SoundChange[];
  explanation: string;
}

interface Props {
  onBack?: () => void;
}

const TYPES: SoundChangeType[] = ['脱落・弱化', '同化', 'リンキング', '短縮形', 'ミックス'];
const LEVELS: Level[] = ['初級', '中級', '上級'];

const LEVEL_COLORS: Record<Level, { base: string; selected: string }> = {
  '初級': { base: 'bg-emerald-50 text-emerald-700 border-emerald-300', selected: 'bg-emerald-500 text-white border-emerald-500' },
  '中級': { base: 'bg-amber-50 text-amber-700 border-amber-300', selected: 'bg-amber-500 text-white border-amber-500' },
  '上級': { base: 'bg-red-50 text-red-700 border-red-300', selected: 'bg-red-500 text-white border-red-500' },
};

const LEVEL_DESC: Record<Level, string> = {
  '初級': '5〜8語 / 変化1〜2箇所',
  '中級': '8〜15語 / 変化3〜5箇所',
  '上級': '15語以上 / 変化5箇所以上',
};

const TYPE_COLORS: Record<SoundChangeType, { base: string; selected: string }> = {
  '脱落・弱化': { base: 'bg-orange-100 text-orange-700 border-orange-300', selected: 'bg-orange-500 text-white border-orange-500' },
  '同化':       { base: 'bg-blue-100 text-blue-700 border-blue-300',   selected: 'bg-blue-500 text-white border-blue-500' },
  'リンキング': { base: 'bg-teal-100 text-teal-700 border-teal-300',   selected: 'bg-teal-500 text-white border-teal-500' },
  '短縮形':     { base: 'bg-rose-100 text-rose-700 border-rose-300',   selected: 'bg-rose-500 text-white border-rose-500' },
  'ミックス':   { base: 'bg-violet-100 text-violet-700 border-violet-300', selected: 'bg-violet-500 text-white border-violet-500' },
};

function speakEnglish(text: string, rate: number = 1.0) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[.,!?;:'"()\-–—]/g, '').trim();
}

function compareAnswers(userInput: string, correct: string) {
  const correctWords = correct.trim().split(/\s+/).filter(Boolean);
  const userWords = userInput.trim().split(/\s+/).filter(Boolean);

  const result = correctWords.map((word, i) => ({
    text: word,
    isCorrect: i < userWords.length && normalizeWord(userWords[i]) === normalizeWord(word),
  }));

  const correctCount = result.filter(w => w.isCorrect).length;
  return { words: result, score: correctCount / Math.max(correctWords.length, 1) };
}

export default function SoundChangeDictation({ onBack }: Props) {
  const [screen, setScreen] = useState<'setup' | 'dictating'>('setup');
  const [level, setLevel] = useState<Level>('初級');
  const [selectedType, setSelectedType] = useState<SoundChangeType>('リンキング');
  const [questions, setQuestions] = useState<DictationQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState<Speed>(1.0);
  const [allDone, setAllDone] = useState(false);

  const current = questions[currentIndex];
  const result = showResult && current ? compareAnswers(currentInput, current.sentence) : null;

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/sound-change-dictation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ level, type: selectedType }),
      });

      const data = await res.json();
      if (!res.ok || !data.questions) {
        throw new Error(data.error || '問題の生成に失敗しました');
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setCurrentInput('');
      setShowResult(false);
      setAllDone(false);
      setScreen('dictating');
    } catch (err) {
      setError(err instanceof Error ? err.message : '問題の生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setCurrentInput('');
      setShowResult(false);
    } else {
      setAllDone(true);
    }
  };

  const handleRestart = () => {
    setScreen('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setCurrentInput('');
    setShowResult(false);
    setAllDone(false);
    setError(null);
  };

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                戻る
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <Mic className="h-5 w-5 text-teal-600" />
              </div>
              <span className="font-bold text-gray-900 text-lg">音変化チャンクディクテーション</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">レベルを選択</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-150 ${
                    level === l
                      ? LEVEL_COLORS[l].selected + ' shadow-lg scale-[1.02]'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-xl font-bold mb-1">{l}</div>
                  <div className={`text-xs font-medium ${level === l ? 'opacity-80' : 'text-gray-400'}`}>
                    {LEVEL_DESC[l]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">音変化タイプを選択</p>
            <div className="flex flex-wrap gap-3">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-150 ${
                    selectedType === t
                      ? TYPE_COLORS[t].selected + ' shadow-md scale-105'
                      : TYPE_COLORS[t].base + ' opacity-70 hover:opacity-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
          )}

          <button
            onClick={fetchQuestions}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-base font-bold rounded-2xl transition-all duration-150 shadow-md"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
            {loading ? '問題を生成中...' : 'スタート（3問）'}
          </button>
        </div>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-10 max-w-md w-full text-center">
          <div className="p-5 bg-teal-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-teal-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">3問完了！</h2>
          <p className="text-gray-500 mb-8 text-sm">お疲れさまでした。また練習しましょう。</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={fetchQuestions}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              同じ設定でもう一度
            </button>
            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold rounded-xl transition-all"
            >
              設定を変えて練習する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="p-1.5 bg-teal-100 rounded-lg">
              <Mic className="h-5 w-5 text-teal-600" />
            </div>
            <span className="font-bold text-gray-900 text-lg">音変化チャンクディクテーション</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${LEVEL_COLORS[level].selected}`}>
              {level}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${TYPE_COLORS[selectedType].selected}`}>
              {selectedType}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i < currentIndex
                    ? 'w-10 bg-teal-500'
                    : i === currentIndex
                    ? 'w-10 bg-teal-300'
                    : 'w-10 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-gray-400 tabular-nums">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {current && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              音声を聞いて書き取ってください
            </p>

            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs text-gray-500 font-medium mr-1">速度:</span>
              {([0.7, 1.0, 1.2] as Speed[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                    speed === s
                      ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={() => speakEnglish(current.sentence, speed)}
              className="flex items-center gap-3 w-full px-5 py-4 bg-teal-50 hover:bg-teal-100 border-2 border-teal-200 hover:border-teal-400 text-teal-700 font-bold rounded-xl transition-all group"
            >
              <div className="p-2 bg-teal-500 group-hover:bg-teal-600 rounded-lg transition-colors flex-shrink-0">
                <Volume2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-base">音声を再生する</span>
              <span className="ml-auto text-xs text-teal-500 font-medium opacity-60">{speed}x</span>
            </button>
          </div>
        )}

        {current && !showResult && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
              書き取り
            </label>
            <textarea
              value={currentInput}
              onChange={e => setCurrentInput(e.target.value)}
              placeholder="聞こえた英文を入力してください..."
              className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-base resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-gray-300 transition-all"
            />
            <button
              onClick={handleCheck}
              disabled={!currentInput.trim()}
              className="mt-4 w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-base"
            >
              答え合わせ
            </button>
          </div>
        )}

        {showResult && current && result && (
          <>
            <div
              className={`rounded-2xl p-5 border-2 ${
                result.score === 1
                  ? 'bg-emerald-50 border-emerald-300'
                  : result.score >= 0.6
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {result.score === 1 ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                )}
                <span
                  className={`text-lg font-bold ${
                    result.score === 1
                      ? 'text-emerald-700'
                      : result.score >= 0.6
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {result.score === 1
                    ? '完璧！'
                    : `${Math.round(result.score * 100)}% 正解`}
                </span>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100 mb-3">
                <p className="text-xs font-bold text-gray-400 mb-2">正解</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.words.map((w, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded font-bold text-base leading-relaxed ${
                        w.isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600 underline decoration-red-400 decoration-2'
                      }`}
                    >
                      {w.text}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-2">あなたの回答</p>
                <p className="text-gray-600 text-sm leading-relaxed">{currentInput || '(未入力)'}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">日本語訳</p>
              <p className="text-gray-700 font-medium leading-relaxed">{current.translation}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 pt-4 pb-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">音変化ルール解説</p>
              </div>
              <div className="divide-y divide-gray-100">
                {current.soundChanges.map((sc, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4 flex-wrap">
                    <span className="font-mono font-bold text-gray-800 min-w-[120px]">{sc.phrase}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-teal-600 font-bold text-lg min-w-[80px]">{sc.phonetic}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg font-mono flex-1">
                      {sc.rule}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 pt-4 pb-2 border-b border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">つまずきポイント</p>
              </div>
              <p className="px-6 py-4 text-sm text-slate-700 leading-relaxed">{current.explanation}</p>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center justify-center gap-2 w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-all text-base shadow-md"
            >
              {currentIndex < questions.length - 1 ? (
                <>次の問題へ <ChevronRight className="h-5 w-5" /></>
              ) : (
                <>結果を見る <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
