import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, ArrowRight as ArrowRightIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Word {
  en: string;
  ja: string;
  example: string;
}

const vocabularyDatabase: Word[] = [
  { en: "abundant", ja: "豊富な", example: "The forest has abundant natural resources." },
  { en: "persevere", ja: "忍耐する", example: "You must persevere through difficult times." },
  { en: "eloquent", ja: "雄弁な", example: "She gave an eloquent speech at the ceremony." },
  { en: "thoroughly", ja: "徹底的に", example: "Please check the document thoroughly before submitting." },
  { en: "ambiguous", ja: "曖昧な", example: "His answer was too ambiguous to understand." },
  { en: "conceive", ja: "思いつく", example: "It's hard to conceive a better solution." },
  { en: "dedicate", ja: "捧げる", example: "He decided to dedicate his life to helping others." },
  { en: "endeavor", ja: "努力する", example: "We will endeavor to complete the project on time." },
  { en: "facilitate", ja: "促進する", example: "Technology can facilitate communication across distances." },
  { en: "genuine", ja: "本物の", example: "She showed genuine concern for his wellbeing." },
  { en: "inevitable", ja: "避けられない", example: "Change is inevitable in any organization." },
  { en: "legitimate", ja: "正当な", example: "That's a legitimate question to ask." },
  { en: "magnificent", ja: "壮大な", example: "The view from the mountain was magnificent." },
  { en: "nevertheless", ja: "それにもかかわらず", example: "It was raining; nevertheless, we went hiking." },
  { en: "obstacle", ja: "障害", example: "Language can be an obstacle to communication." },
  { en: "practical", ja: "実用的な", example: "We need a practical solution to this problem." },
  { en: "reluctant", ja: "気が進まない", example: "He was reluctant to accept the offer." },
  { en: "substantial", ja: "かなりの", example: "There has been substantial progress this year." },
  { en: "tremendous", ja: "途方もない", example: "The team made a tremendous effort." },
  { en: "unanimous", ja: "全員一致の", example: "The decision was unanimous among all members." },
  { en: "versatile", ja: "多才な", example: "She is a versatile athlete who excels at many sports." },
  { en: "adequate", ja: "十分な", example: "Make sure you get adequate rest before the exam." },
  { en: "beneficial", ja: "有益な", example: "Regular exercise is beneficial for your health." },
  { en: "coherent", ja: "首尾一貫した", example: "Please write a coherent explanation of your idea." },
  { en: "delicate", ja: "繊細な", example: "This is a delicate situation that requires care." },
  { en: "efficient", ja: "効率的な", example: "We need to find a more efficient way to work." },
  { en: "feasible", ja: "実行可能な", example: "The plan seems feasible within our budget." },
  { en: "generous", ja: "寛大な", example: "Thank you for your generous donation." },
  { en: "hostile", ja: "敵意のある", example: "The atmosphere in the meeting was hostile." },
  { en: "immense", ja: "巨大な", example: "The project requires an immense amount of work." },
  { en: "potential", ja: "潜在的な", example: "This technology has great potential for the future." },
  { en: "prominent", ja: "著名な", example: "She is a prominent figure in the art world." },
  { en: "relevant", ja: "関連のある", example: "Please include only relevant information in your report." },
  { en: "rigorous", ja: "厳格な", example: "The training program is very rigorous." },
  { en: "sincere", ja: "誠実な", example: "I appreciate your sincere apology." },
  { en: "subsequent", ja: "その後の", example: "We will discuss this in subsequent meetings." },
  { en: "sufficient", ja: "十分な", example: "Do we have sufficient evidence to prove this?" },
  { en: "temporary", ja: "一時的な", example: "This is just a temporary solution." },
  { en: "ultimate", ja: "究極の", example: "What is your ultimate goal in life?" },
  { en: "undergo", ja: "経験する", example: "The company will undergo major changes next year." },
  { en: "valid", ja: "有効な", example: "That's a valid point worth considering." },
  { en: "vigorous", ja: "精力的な", example: "The debate sparked vigorous discussion." },
  { en: "comprehend", ja: "理解する", example: "It's difficult to comprehend the complexity of this issue." },
  { en: "emphasize", ja: "強調する", example: "I want to emphasize the importance of teamwork." },
  { en: "establish", ja: "確立する", example: "We need to establish clear guidelines." },
  { en: "implement", ja: "実施する", example: "The school will implement the new policy next month." },
  { en: "justify", ja: "正当化する", example: "Can you justify your decision?" },
  { en: "maintain", ja: "維持する", example: "It's important to maintain a positive attitude." },
  { en: "perceive", ja: "知覚する", example: "How do you perceive this situation?" },
  { en: "preserve", ja: "保存する", example: "We must preserve our cultural heritage." },
  { en: "resolve", ja: "解決する", example: "Let's work together to resolve this conflict." },
  { en: "sustain", ja: "持続する", example: "How can we sustain economic growth?" },
  { en: "acquire", ja: "獲得する", example: "She worked hard to acquire new skills." },
  { en: "accomplish", ja: "達成する", example: "We accomplished our goal ahead of schedule." },
  { en: "attribute", ja: "～のせいにする", example: "He attributes his success to hard work." },
];

type GameState = 'select-source' | 'select-mode' | 'ready' | 'pitching' | 'showing-word' | 'showing-example' | 'showing-answer' | 'showing-result' | 'game-over';
type QuizMode = 'en-ja' | 'ja-en';
type SourceType = 'notion_perfect' | 'notion_review' | 'notion_learning' | 'builtin' | null;

interface Props {
  onBack: () => void;
}

export default function BaseballVocabulary({ onBack }: Props) {
  const [gameState, setGameState] = useState<GameState>('select-source');
  const [mode, setMode] = useState<QuizMode>('en-ja');
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [activeWords, setActiveWords] = useState<Word[]>([]);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);

  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [remaining, setRemaining] = useState(10);
  const [usedWords, setUsedWords] = useState<Word[]>([]);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 100, scale: 1 });
  const [batterSwing, setBatterSwing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback((type: 'pitch' | 'hit' | 'correct' | 'incorrect' | 'end') => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    const now = ctx.currentTime;
    switch (type) {
      case 'pitch':
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now); oscillator.stop(now + 0.1);
        break;
      case 'hit':
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now); oscillator.stop(now + 0.15);
        break;
      case 'correct':
        oscillator.frequency.setValueAtTime(523, now);
        oscillator.frequency.setValueAtTime(659, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.setValueAtTime(0.3, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        oscillator.start(now); oscillator.stop(now + 0.25);
        break;
      case 'incorrect':
        oscillator.frequency.setValueAtTime(200, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now); oscillator.stop(now + 0.3);
        break;
      case 'end':
        oscillator.frequency.setValueAtTime(523, now);
        oscillator.frequency.setValueAtTime(659, now + 0.15);
        oscillator.frequency.setValueAtTime(784, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.setValueAtTime(0.3, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now); oscillator.stop(now + 0.5);
        break;
    }
  }, []);

  const getValidSession = async () => {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session) return refreshed.session;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const loadNotionSource = async (status: string, type: SourceType) => {
    setIsLoadingSource(true);
    setSourceError(null);
    setDebugInfo(null);
    try {
      const session = await getValidSession();
      if (!session) {
        setSourceError('ログインが必要です。');
        setIsLoadingSource(false);
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vocab-source?status=${encodeURIComponent(status)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const responseData = await response.json().catch(() => ({ error: 'レスポンスの解析に失敗しました' }));
      if (!response.ok) {
        setSourceError(responseData.error || 'データの取得に失敗しました。');
        setIsLoadingSource(false);
        return;
      }
      const items: Word[] = responseData.items || [];
      if (items.length === 0) {
        const shuffled = [...vocabularyDatabase].sort(() => Math.random() - 0.5).slice(0, 10);
        setSourceType(type);
        setActiveWords(shuffled);
        setGameState('select-mode');
        setIsLoadingSource(false);
        return;
      }
      setSourceType(type);
      setActiveWords(items);
      setGameState('select-mode');
    } catch (error) {
      console.error('Source load error:', error);
      setSourceError('データの取得中にエラーが発生しました。');
    } finally {
      setIsLoadingSource(false);
    }
  };

  const loadBuiltinSource = () => {
    const shuffled = [...vocabularyDatabase].sort(() => Math.random() - 0.5).slice(0, 10);
    setSourceType('builtin');
    setActiveWords(shuffled);
    setSourceError(null);
    setDebugInfo(null);
    setGameState('select-mode');
  };

  const loadDebugInfo = async () => {
    setIsLoadingDebug(true);
    setDebugInfo(null);
    try {
      const session = await getValidSession();
      if (!session) { setDebugInfo({ error: 'セッションが見つかりません。再ログインしてください。' }); return; }
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vocab-source?debug=1&status=覚え中`,
        { headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      setDebugInfo(data);
    } catch (e) {
      setDebugInfo({ error: String(e) });
    } finally {
      setIsLoadingDebug(false);
    }
  };

  const getRandomWord = useCallback(() => {
    const available = activeWords.filter(w => !usedWords.some(u => u.en === w.en));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }, [activeWords, usedWords]);

  const handlePitch = useCallback(() => {
    if (gameState !== 'ready') return;
    playSound('pitch');
    setGameState('pitching');
    setBallPosition({ x: 50, y: 100, scale: 1 });
    setTimeout(() => setBallPosition({ x: 50, y: 20, scale: 0.3 }), 50);
    setTimeout(() => { setBatterSwing(true); playSound('hit'); }, 600);
    setTimeout(() => {
      const word = getRandomWord();
      if (word) { setCurrentWord(word); setUsedWords(prev => [...prev, word]); }
      setGameState('showing-word');
      setBatterSwing(false);
      setBallPosition({ x: 50, y: 100, scale: 1 });
    }, 800);
  }, [gameState, getRandomWord, playSound]);

  const handleShowExample = useCallback(() => {
    if (gameState !== 'showing-word' || !currentWord) return;
    setGameState('showing-example');
  }, [gameState, currentWord]);

  const handleShowAnswer = useCallback(() => {
    if ((gameState !== 'showing-word' && gameState !== 'showing-example') || !currentWord) return;
    setShowMeaning(true);
    setGameState('showing-answer');
  }, [gameState, currentWord]);

  const handleAnswer = useCallback((knowIt: boolean) => {
    if (gameState !== 'showing-answer' || !currentWord) return;
    setIsCorrect(knowIt);
    setGameState('showing-result');
    setBatterSwing(true);
    playSound('hit');
    if (knowIt) {
      setCorrect(prev => prev + 1);
      playSound('correct');
      setTimeout(() => setBallPosition({ x: 100, y: 80, scale: 0.3 }), 100);
      setTimeout(() => setBallPosition({ x: 120, y: 120, scale: 0.2 }), 500);
    } else {
      setIncorrect(prev => prev + 1);
      setWrongWords(prev => [...prev, currentWord]);
      playSound('incorrect');
      setTimeout(() => setBallPosition({ x: 10, y: 40, scale: 0.5 }), 100);
      setTimeout(() => setBallPosition({ x: -20, y: 20, scale: 0.3 }), 500);
    }
    setTimeout(() => {
      setShowMeaning(false);
      setIsCorrect(null);
      setBallPosition({ x: 50, y: 100, scale: 1 });
      setBatterSwing(false);
      const newRemaining = remaining - 1;
      setRemaining(newRemaining);
      if (newRemaining === 0) { setGameState('game-over'); playSound('end'); }
      else setGameState('ready');
    }, 2000);
  }, [gameState, currentWord, remaining, playSound]);

  const handleModeSelect = useCallback((selectedMode: QuizMode) => {
    setMode(selectedMode);
    setGameState('ready');
    setCurrentWord(null);
    setCorrect(0);
    setIncorrect(0);
    setRemaining(10);
    setUsedWords([]);
    setWrongWords([]);
    setShowMeaning(false);
    setIsCorrect(null);
    setBallPosition({ x: 50, y: 100, scale: 1 });
  }, []);

  const handleRestart = useCallback(() => {
    const reshuffled = [...activeWords].sort(() => Math.random() - 0.5);
    setActiveWords(reshuffled);
    setGameState('ready');
    setCurrentWord(null);
    setCorrect(0);
    setIncorrect(0);
    setRemaining(10);
    setUsedWords([]);
    setWrongWords([]);
    setShowMeaning(false);
    setIsCorrect(null);
    setBallPosition({ x: 50, y: 100, scale: 1 });
  }, [activeWords]);

  const handleNextSet = useCallback(() => {
    setGameState('select-source');
    setSourceType(null);
    setActiveWords([]);
    setCurrentWord(null);
    setCorrect(0);
    setIncorrect(0);
    setRemaining(10);
    setUsedWords([]);
    setWrongWords([]);
    setShowMeaning(false);
    setIsCorrect(null);
    setBallPosition({ x: 50, y: 100, scale: 1 });
    setSourceError(null);
    setDebugInfo(null);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'ready') handlePitch();
        else if (gameState === 'showing-word' || gameState === 'showing-example') handleShowAnswer();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (gameState === 'showing-word') handleShowExample();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (gameState === 'showing-answer') handleAnswer(true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (gameState === 'showing-answer') handleAnswer(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, handlePitch, handleShowExample, handleShowAnswer, handleAnswer]);

  if (gameState === 'select-source') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-green-800 flex flex-col">
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft size={20} />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-white">英単語100本ノック</h1>
            <div className="w-24" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">データソースを選ぶ</h2>
            <p className="text-sm text-gray-500 mb-6">出題する単語のソースを選択してください</p>

            {sourceError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {sourceError}
              </div>
            )}

            {isLoadingSource ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={40} className="animate-spin text-green-600" />
                <p className="text-gray-600">Notionからデータを取得中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => loadNotionSource('完璧', 'notion_perfect')}
                  className="py-5 px-4 rounded-xl font-bold text-white text-lg bg-yellow-400 hover:bg-yellow-500 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Notion：完璧
                </button>
                <button
                  onClick={() => loadNotionSource('要復習', 'notion_review')}
                  className="py-5 px-4 rounded-xl font-bold text-white text-lg bg-sky-400 hover:bg-sky-500 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Notion：要復習
                </button>
                <button
                  onClick={() => loadNotionSource('覚え中', 'notion_learning')}
                  className="py-5 px-4 rounded-xl font-bold text-white text-lg bg-teal-400 hover:bg-teal-500 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Notion：覚え中
                </button>
                <button
                  onClick={loadBuiltinSource}
                  className="py-5 px-4 rounded-xl font-bold text-white text-lg bg-green-500 hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  センター
                </button>
              </div>
            )}

            <div className="mt-6 border-t pt-4">
              <button
                onClick={loadDebugInfo}
                disabled={isLoadingDebug}
                className="text-xs text-blue-500 hover:text-blue-700 underline"
              >
                {isLoadingDebug ? '確認中...' : '[デバッグ] Notionデータ構造を確認'}
              </button>
              {debugInfo && (
                <pre className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 overflow-auto max-h-48">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (gameState === 'select-mode') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-green-800 flex flex-col">
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setGameState('select-source')} className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft size={20} />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-white">英単語100本ノック</h1>
            <div className="w-24" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-3xl w-full animate-[slideUp_0.5s_ease-out]">
            <h2 className="text-4xl font-bold text-center mb-2">モード選択</h2>
            <p className="text-sm text-center text-gray-500 mb-2">
              {sourceType === 'builtin' ? '内蔵データ' : `Notion：${sourceType === 'notion_perfect' ? '完璧' : sourceType === 'notion_review' ? '要復習' : '覚え中'}`}
              　から {activeWords.length} 単語
            </p>
            <p className="text-lg text-center text-gray-600 mb-10">学習モードを選択してください</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleModeSelect('en-ja')}
                className="group relative bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-8 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">EN</div>
                  <h3 className="text-2xl font-bold mb-3">英和モード</h3>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-3">
                    <p className="text-lg">English → 日本語</p>
                  </div>
                  <p className="text-sm opacity-90">英語を見て日本語の意味を確認</p>
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('ja-en')}
                className="group relative bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-8 hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">日</div>
                  <h3 className="text-2xl font-bold mb-3">和英モード</h3>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-3">
                    <p className="text-lg">日本語 → English</p>
                  </div>
                  <p className="text-sm opacity-90">日本語を見て英語を確認</p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (gameState === 'game-over') {
    const totalPitches = 10;
    const correctRate = Math.round((correct / totalPitches) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-green-800 flex flex-col">
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft size={20} />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-white">英単語100本ノック</h1>
            <div className="w-24" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full animate-[slideUp_0.5s_ease-out]">
            <h2 className="text-4xl font-bold text-center mb-8">結果発表！</h2>

            <div className="text-center mb-8">
              <p className="text-2xl mb-4">{totalPitches}球中</p>
              <div className="space-y-2 text-xl">
                <p className="text-green-600 font-bold">正解：{correct}本</p>
                <p className="text-red-600 font-bold">不正解：{incorrect}本</p>
                <p className="text-blue-600 font-bold text-3xl mt-4">正解率：{correctRate}%</p>
              </div>
            </div>

            {wrongWords.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-red-600">【不正解だった単語】</h3>
                <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                  {wrongWords.map((word, index) => (
                    <p key={index} className="text-lg">
                      ・<span className="font-bold">{mode === 'en-ja' ? word.en : word.ja}</span> → {mode === 'en-ja' ? word.ja : word.en}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                <RotateCcw size={20} />
                同じ単語でもう一度
              </button>
              <button
                onClick={handleNextSet}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
              >
                <ArrowRightIcon size={20} />
                別のソースを選ぶ
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-green-800 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.3) 0%, transparent 50%)' }}
      />

      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft size={20} />
            戻る
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">英単語100本ノック</h1>
            <p className="text-sm text-white/80 mt-1">
              {mode === 'en-ja' ? '英和モード (English → 日本語)' : '和英モード (日本語 → English)'}
            </p>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 mb-8 text-white text-xl font-bold text-center">
          <span className="mr-6">正解: {correct}</span>
          <span className="mr-6">不正解: {incorrect}</span>
          <span>残り: {remaining}</span>
        </div>

        <div className="relative h-[500px] flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={batterSwing ? "/batter2.png" : "/batter1.png"}
              alt="バッター"
              className="h-[400px] w-auto object-contain filter drop-shadow-lg"
              style={{ imageRendering: 'auto', pointerEvents: 'none' }}
            />
          </div>

          {gameState !== 'ready' && (
            <div
              className="absolute transition-all duration-700 ease-in-out"
              style={{
                left: `${ballPosition.x}%`,
                bottom: `${ballPosition.y}%`,
                transform: `translate(-50%, 50%) scale(${ballPosition.scale})`,
              }}
            >
              <img
                src="/ball.png"
                alt="ボール"
                className="w-16 h-16 object-contain filter drop-shadow-lg"
                style={{ imageRendering: 'auto', pointerEvents: 'none' }}
              />
            </div>
          )}

          {currentWord && gameState === 'showing-word' && (
            <div className="absolute inset-0 flex items-center justify-center animate-[fadeIn_0.5s_ease-out]">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-2xl">
                <p className="text-6xl font-bold text-gray-900 text-center">
                  {mode === 'en-ja' ? currentWord.en : currentWord.ja}
                </p>
              </div>
            </div>
          )}

          {currentWord && gameState === 'showing-example' && (
            <div className="absolute inset-0 flex items-center justify-center animate-[fadeIn_0.5s_ease-out]">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-2xl max-w-3xl">
                <p className="text-5xl font-bold text-gray-900 text-center mb-6">
                  {mode === 'en-ja' ? currentWord.en : currentWord.ja}
                </p>
                {currentWord.example && (
                  <div className="bg-blue-50 rounded-xl p-6">
                    <p className="text-sm text-blue-600 font-bold mb-2">例文</p>
                    <p className="text-2xl text-gray-800 leading-relaxed">{currentWord.example}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentWord && (gameState === 'showing-answer' || gameState === 'showing-result') && (
            <div className="absolute inset-0 flex items-center justify-center animate-[slideUp_0.3s_ease-out]">
              <div className={`${
                gameState === 'showing-result'
                  ? (isCorrect ? 'bg-green-500' : 'bg-red-500')
                  : 'bg-blue-500'
              } text-white rounded-2xl p-12 shadow-2xl`}>
                <p className="text-5xl font-bold text-center mb-4">
                  {mode === 'en-ja' ? currentWord.en : currentWord.ja}
                </p>
                <p className="text-4xl text-center">
                  {mode === 'en-ja' ? currentWord.ja : currentWord.en}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg p-6 text-white">
            <p className="text-xl font-bold mb-2">キー操作</p>
            {gameState === 'ready' && <p className="text-lg">↑ 投球して{mode === 'en-ja' ? '英単語' : '日本語の意味'}を表示</p>}
            {gameState === 'showing-word' && (
              <div className="text-lg space-y-1">
                <p>↑ {mode === 'en-ja' ? '日本語の意味' : '英語'}を表示</p>
                <p>↓ 例文を表示</p>
              </div>
            )}
            {gameState === 'showing-example' && <p className="text-lg">↑ {mode === 'en-ja' ? '日本語の意味' : '英語'}を表示</p>}
            {gameState === 'showing-answer' && <p className="text-lg">← まちがえた　わかった →</p>}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
