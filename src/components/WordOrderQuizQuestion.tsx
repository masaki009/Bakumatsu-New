import { useState } from 'react';
import { Lightbulb, CheckCircle, XCircle, ArrowRight, Home, PenLine, Loader2, MessageSquare } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Question {
  japanese: string;
  blocks: string[];
  answer: string[];
  english: string;
  hint: string;
}

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  placedBlocks: string[];
  onPlaceBlock: (word: string) => void;
  onRemoveBlock: (index: number) => void;
  onNext: (isCorrect: boolean) => void;
  onBack: () => void;
}

export default function WordOrderQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  placedBlocks,
  onPlaceBlock,
  onRemoveBlock,
  onNext,
  onBack,
}: Props) {
  const [showHint, setShowHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeText, setChallengeText] = useState('');
  const [challengeFeedback, setChallengeFeedback] = useState('');
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState('');

  const usedCountsCopy: Record<string, number> = {};
  placedBlocks.forEach((w) => { usedCountsCopy[w] = (usedCountsCopy[w] || 0) + 1; });

  const blockUsed = question.blocks.map((w) => {
    if (usedCountsCopy[w] > 0) {
      usedCountsCopy[w]--;
      return true;
    }
    return false;
  });

  const handleCheck = () => {
    const correct =
      placedBlocks.length === question.answer.length &&
      placedBlocks.every((w, i) => w === question.answer[i]);
    setIsCorrect(correct);
    setChecked(true);
  };

  const handleChallenge = async () => {
    if (!challengeText.trim()) return;
    setChallengeLoading(true);
    setChallengeError('');
    setChallengeError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/word-quiz-challenge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          japanese: question.japanese,
          correctEnglish: question.english,
          userEnglish: challengeText.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API error');
      }
      const data = await res.json();
      setChallengeFeedback(data.feedback);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました';
      setChallengeError(msg);
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleToggleChallenge = () => {
    setChallengeOpen((v) => !v);
    if (challengeOpen) {
      setChallengeText('');
      setChallengeFeedback('');
      setChallengeError('');
    }
  };

  const renderFeedbackParagraphs = (text: string) => {
    return text.split('\n').map((line, i) => {
      const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return (
        <p
          key={i}
          className="text-sm text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: boldLine }}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-[480px] flex flex-col gap-5">

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500">
              問題 {questionNumber} / {totalQuestions}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">日本語文</p>
          <p className="text-lg font-bold text-slate-800 leading-relaxed">{question.japanese}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">英語の語順に並べてください</p>
          <div className="min-h-[60px] flex flex-wrap gap-2 bg-white border-2 border-dashed border-slate-300 rounded-2xl px-4 py-3 shadow-inner">
            {placedBlocks.length === 0 && (
              <span className="text-slate-400 text-sm italic">下のブロックをタップして並べてください</span>
            )}
            {placedBlocks.map((word, i) => (
              <button
                key={i}
                onClick={() => !checked && onRemoveBlock(i)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                  checked
                    ? isCorrect
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default'
                      : 'bg-red-100 text-red-700 border border-red-300 cursor-default'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">選択肢（タップして追加）</p>
          <div className="flex flex-wrap gap-2 min-h-[48px]">
            {question.blocks.map((word, i) =>
              blockUsed[i] ? (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold border-2 border-dashed border-slate-200 text-transparent select-none"
                  aria-hidden="true"
                >
                  {word}
                </div>
              ) : (
                <button
                  key={i}
                  onClick={() => !checked && onPlaceBlock(word)}
                  disabled={checked}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-full text-sm font-semibold hover:bg-slate-50 hover:border-blue-400 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-default"
                >
                  {word}
                </button>
              )
            )}
          </div>
        </div>

        {showHint && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{question.hint}</p>
          </div>
        )}

        {checked && (
          <div className={`rounded-2xl px-4 py-4 ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              {isCorrect ? (
                <CheckCircle size={18} className="text-emerald-500" />
              ) : (
                <XCircle size={18} className="text-red-500" />
              )}
              <span className={`font-bold text-base ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                {isCorrect ? '正解！' : '不正解'}
              </span>
            </div>

            {!isCorrect && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">正しい語順：</p>
                <p className="text-sm text-slate-700 font-medium">{question.answer.join(' → ')}</p>
              </div>
            )}

            <div className="pt-3 border-t border-black/10">
              <p className="text-xs font-semibold text-slate-500 mb-1">英文</p>
              <p className="text-base text-slate-800 font-bold">{question.english}</p>
            </div>
          </div>
        )}

        {checked && challengeOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <PenLine size={16} className="text-blue-500" />
              <p className="text-sm font-bold text-slate-700">自分で英文を書いて比較してみよう</p>
            </div>

            {!challengeFeedback ? (
              <>
                <textarea
                  value={challengeText}
                  onChange={(e) => setChallengeText(e.target.value)}
                  placeholder="英文を入力してください..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                />
                {challengeError && (
                  <p className="text-xs text-red-500">{challengeError}</p>
                )}
                <button
                  onClick={handleChallenge}
                  disabled={!challengeText.trim() || challengeLoading}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {challengeLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={15} />
                      確認する
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-400 mb-1">あなたの英文</p>
                  <p className="text-sm text-slate-700 font-medium">{challengeText}</p>
                </div>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-3">
                  <MessageSquare size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1.5">
                    {renderFeedbackParagraphs(challengeFeedback)}
                  </div>
                </div>
                <button
                  onClick={() => { setChallengeText(''); setChallengeFeedback(''); setChallengeError(''); }}
                  className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700 transition self-start"
                >
                  別の英文を試す
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!checked && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
            >
              <Lightbulb size={16} />
              ヒント
            </button>
          )}

          {checked && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Home size={16} />
              メニュー
            </button>
          )}

          {checked && (
            <button
              onClick={handleToggleChallenge}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors border ${
                challengeOpen
                  ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PenLine size={16} />
              チャレンジ
            </button>
          )}

          {!checked ? (
            <button
              onClick={handleCheck}
              disabled={placedBlocks.length === 0}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              答え合わせ
            </button>
          ) : (
            <button
              onClick={() => onNext(isCorrect)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors shadow-md"
            >
              {questionNumber < totalQuestions ? '次の問題' : '結果を見る'}
              <ArrowRight size={16} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
