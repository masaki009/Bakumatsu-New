import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Loader2, RefreshCw, BookOpen, Languages, FileText, ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getJSTDate } from '../utils/dateUtils';

interface Props {
  onBack: () => void;
}

type Phase = 'genre-select' | 'step1' | 'step2' | 'step3' | 'summary';
type Difficulty = '初級' | '中級' | '上級';

interface ProcessResult {
  original: string;
  simplified: string;
  english: string;
  vocabulary: { word: string; directTranslation: string }[];
}

const GENRES = [
  '国内ニュース', '海外ニュース', '政治', 'エンタメ',
  '経済', '文化', 'ビジネス', 'スポーツ',
  '一般', '社会', 'IT', '健康',
];

const GENRE_COLORS = [
  'bg-blue-50 border-blue-200 hover:border-blue-500 text-blue-700',
  'bg-sky-50 border-sky-200 hover:border-sky-500 text-sky-700',
  'bg-slate-50 border-slate-200 hover:border-slate-500 text-slate-700',
  'bg-pink-50 border-pink-200 hover:border-pink-500 text-pink-700',
  'bg-amber-50 border-amber-200 hover:border-amber-500 text-amber-700',
  'bg-teal-50 border-teal-200 hover:border-teal-500 text-teal-700',
  'bg-cyan-50 border-cyan-200 hover:border-cyan-500 text-cyan-700',
  'bg-green-50 border-green-200 hover:border-green-500 text-green-700',
  'bg-gray-50 border-gray-200 hover:border-gray-500 text-gray-700',
  'bg-orange-50 border-orange-200 hover:border-orange-500 text-orange-700',
  'bg-indigo-50 border-indigo-200 hover:border-indigo-500 text-indigo-700',
  'bg-red-50 border-red-200 hover:border-red-500 text-red-700',
];

const STEP_LABELS: { phase: Phase; label: string }[] = [
  { phase: 'step1', label: 'Step 1' },
  { phase: 'step2', label: 'Step 2' },
  { phase: 'step3', label: 'Step 3' },
  { phase: 'summary', label: 'まとめ' },
];

const PHASE_INDEX: Record<Phase, number> = {
  'genre-select': -1,
  step1: 0,
  step2: 1,
  step3: 2,
  summary: 3,
};

const DIFFICULTIES: { id: Difficulty; desc: string }[] = [
  { id: '初級', desc: 'A1-A2 / 短く平易な文' },
  { id: '中級', desc: 'B1-B2 / 日常的な表現' },
  { id: '上級', desc: 'C1-C2 / 複雑・専門的な文' },
];

function levelToDifficulty(level: string): Difficulty {
  if (['A1', 'A2'].includes(level)) return '初級';
  if (['C1', 'C2'].includes(level)) return '上級';
  return '中級';
}

export default function JapaneseToEnglishProcess({ onBack }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('genre-select');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('中級');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('self_profiles')
      .select('current_level')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.current_level) setDifficulty(levelToDifficulty(data.current_level));
      });
  }, [user?.id]);

  const fetchContent = async (genre: string, diff: Difficulty) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/japanese-english-process`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ genre, difficulty: diff }),
        }
      );
      if (!res.ok) throw new Error('生成に失敗しました');
      const data: ProcessResult = await res.json();
      if (data.error) throw new Error(data.error as unknown as string);
      setResult(data);
      setPhase('step1');
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    fetchContent(genre, difficulty);
  };

  const incrementOSpeaking = async () => {
    if (!user?.id || !user?.email) return;
    const today = getJSTDate();
    const { data: diary } = await supabase
      .from('s_diaries')
      .select('o_speaking')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    if (diary) {
      await supabase
        .from('s_diaries')
        .update({ o_speaking: (diary.o_speaking ?? 0) + 1 })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await supabase
        .from('s_diaries')
        .insert({ user_id: user.id, email: user.email, date: today, o_speaking: 1 });
    }
  };

  const handleRetry = async () => {
    await incrementOSpeaking();
    setPhase('genre-select');
    setResult(null);
    setError(null);
    setSelectedGenre('');
  };

  const handleNewSentence = async () => {
    await incrementOSpeaking();
    fetchContent(selectedGenre, difficulty);
    setPhase('genre-select');
  };

  const currentStepIndex = PHASE_INDEX[phase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            戻る
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Languages size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">和英プロセス練習</h1>
              <p className="text-xs text-gray-500">日本語 → 簡単な日本語 → 英語</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {phase !== 'genre-select' && !loading && (
          <div className="flex items-center gap-2 mb-8">
            {STEP_LABELS.map((s, i) => (
              <div key={s.phase} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-all ${
                    i < currentStepIndex
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : i === currentStepIndex
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    i === currentStepIndex ? 'text-blue-600' : i < currentStepIndex ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-px w-6 sm:w-12 ${i < currentStepIndex ? 'bg-blue-400' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="p-6 bg-white rounded-2xl shadow-md">
              <Loader2 size={48} className="text-blue-500 animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">文章を生成中...</p>
            <p className="text-sm text-gray-400">ジャンル：{selectedGenre}　難易度：{difficulty}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <RefreshCw size={16} />
              もう一度試す
            </button>
          </div>
        )}

        {!loading && !error && phase === 'genre-select' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ジャンルを選んでください</h2>
              <p className="text-gray-500 text-sm">選んだジャンルの日本語文を生成します</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {GENRES.map((genre, i) => (
                <button
                  key={genre}
                  onClick={() => handleGenreSelect(genre)}
                  className={`border-2 rounded-xl px-4 py-4 text-sm font-semibold transition-all hover:shadow-md active:scale-95 ${GENRE_COLORS[i]}`}
                >
                  {genre}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">難易度選択</p>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map((d) => {
                  const active = difficulty === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`relative text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                    >
                      <span className={`block font-bold text-sm ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                        {d.id}
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5 leading-tight">{d.desc}</span>
                      {active && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && phase === 'step1' && result && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">ジャンル：{selectedGenre}</span>
                <span className="ml-auto text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{difficulty}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3 font-medium">次の日本語文を英語に訳す練習をしましょう</p>
              <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-400">
                <p className="text-xl font-bold text-gray-900 leading-relaxed">{result.original}</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <p className="text-base font-semibold text-amber-800 mb-1">Step 2 への準備</p>
              <p className="text-lg font-bold text-amber-900">
                簡単な日本語で言うとどうなるか考えてください
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPhase('step2')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md"
              >
                次へ
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {!loading && !error && phase === 'step2' && result && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-400 mb-2">元の日本語</p>
              <p className="text-gray-500 text-base mb-5 border-b pb-4">{result.original}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <BookOpen size={18} className="text-teal-600" />
                </div>
                <span className="text-sm font-semibold text-teal-700">簡単な日本語</span>
              </div>
              <div className="bg-teal-50 rounded-xl p-5 border-l-4 border-teal-400">
                <p className="text-xl font-bold text-gray-900 leading-relaxed">{result.simplified}</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <p className="text-base font-semibold text-amber-800 mb-1">Step 3 への準備</p>
              <p className="text-lg font-bold text-amber-900">これを英語に訳してください</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPhase('step3')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md"
              >
                次へ
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {!loading && !error && phase === 'step3' && result && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-400 mb-1">簡単な日本語</p>
              <p className="text-gray-500 text-base mb-5 border-b pb-4">{result.simplified}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Languages size={18} className="text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-700">英文</span>
              </div>
              <div className="bg-green-50 rounded-xl p-5 border-l-4 border-green-400">
                <p className="text-2xl font-bold text-gray-900 leading-relaxed">{result.english}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">和文（言い換え後）</p>
                <p className="text-gray-600">{result.simplified}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPhase('summary')}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all shadow-md"
              >
                まとめを見る
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {!loading && !error && phase === 'summary' && result && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ListChecks size={18} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">まとめ</h2>
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{selectedGenre}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{difficulty}</span>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-blue-600 px-4 py-2">
                    <p className="text-xs font-bold text-white uppercase tracking-wide">元の日本文</p>
                  </div>
                  <div className="bg-blue-50 px-4 py-4">
                    <p className="text-lg font-bold text-gray-900">{result.original}</p>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-teal-600 px-4 py-2">
                    <p className="text-xs font-bold text-white uppercase tracking-wide">簡単な日本語</p>
                  </div>
                  <div className="bg-teal-50 px-4 py-4">
                    <p className="text-lg font-bold text-gray-900">{result.simplified}</p>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-green-600 px-4 py-2">
                    <p className="text-xs font-bold text-white uppercase tracking-wide">英文</p>
                  </div>
                  <div className="bg-green-50 px-4 py-4">
                    <p className="text-2xl font-bold text-gray-900">{result.english}</p>
                  </div>
                </div>

                {result.vocabulary && result.vocabulary.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    <div className="bg-amber-500 px-4 py-2">
                      <p className="text-xs font-bold text-white uppercase tracking-wide">単語（難語の直訳例）</p>
                    </div>
                    <div className="bg-amber-50 px-4 py-4 space-y-3">
                      {result.vocabulary.map((v, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800">
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-bold text-gray-900">{v.word}</span>
                            <span className="text-gray-400 mx-2">→</span>
                            <span className="text-gray-600 italic">{v.directTranslation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleNewSentence}
                className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md"
              >
                <RefreshCw size={18} />
                同じジャンルでもう一問
              </button>
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-400 active:scale-95 transition-all"
              >
                ジャンルを変える
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
