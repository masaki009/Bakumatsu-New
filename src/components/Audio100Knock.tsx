import { useState, useRef } from 'react';
import { ArrowLeft, RotateCcw, Play, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Stage = 'source-select' | 'ball-select' | 'playing';
type SourceType = 'notion_perfect' | 'notion_review' | 'notion_learning' | 'github' | null;

interface AudioFile {
  name: string;
  url: string;
}

interface Props {
  onBack: () => void;
}

function BallSVG({ size = 48, highlight = false }: { size?: number; highlight?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: highlight ? 'drop-shadow(0 0 8px #facc15)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
    >
      <circle cx="50" cy="50" r="46" fill="white" stroke="#e5e7eb" strokeWidth="2" />
      <path d="M 20 35 Q 30 28 40 35 Q 50 42 60 35 Q 70 28 80 35" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 20 65 Q 30 72 40 65 Q 50 58 60 65 Q 70 72 80 65" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 35 20 Q 28 30 35 40 Q 42 50 35 60 Q 28 70 35 80" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 65 20 Q 72 30 65 40 Q 58 50 65 60 Q 72 70 65 80" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

const SOURCE_LABELS: Record<NonNullable<SourceType>, string> = {
  notion_perfect: 'Notion：完璧',
  notion_review: 'Notion：要復習',
  notion_learning: 'Notion：覚え中',
  github: 'センター',
};

export default function Audio100Knock({ onBack }: Props) {
  const [stage, setStage] = useState<Stage>('source-select');
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 100, scale: 1 });
  const [batterSwing, setBatterSwing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [selectedSource, setSelectedSource] = useState<SourceType>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getValidSession = async () => {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session) return refreshed.session;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const loadNotionSource = async (status: string, sourceType: SourceType) => {
    setIsLoadingSource(true);
    setSourceError(null);
    setSelectedSource(null);
    setAudioFiles([]);

    try {
      const session = await getValidSession();
      if (!session) {
        setSourceError('ログインが必要です。');
        setIsLoadingSource(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-memory-source?status=${encodeURIComponent(status)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const responseData = await response.json().catch(() => ({ items: [] }));
      const items: { audioUrl: string; engText: string }[] = responseData.items || [];

      if (items.length === 0) {
        setSourceError('データが見つかりませんでした。');
        setIsLoadingSource(false);
        return;
      }

      const files: AudioFile[] = items.map((item) => ({
        name: item.engText,
        url: item.audioUrl,
      }));

      setSelectedSource(sourceType);
      setAudioFiles(files);
    } catch (error) {
      console.error('Source load error:', error);
      setSourceError('データの取得中にエラーが発生しました。');
    } finally {
      setIsLoadingSource(false);
    }
  };

  const loadGithubSource = async () => {
    setIsLoadingSource(true);
    setSourceError(null);
    setSelectedSource(null);
    setAudioFiles([]);

    try {
      const session = await getValidSession();
      if (!session) {
        setSourceError('ログインが必要です。');
        setIsLoadingSource(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-memory-source?status=github`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const responseData = await response.json().catch(() => ({ items: [] }));
      const items: { audioUrl: string; engText: string }[] = responseData.items || [];

      const files: AudioFile[] = items.length > 0
        ? items.map((item) => ({ name: item.engText, url: item.audioUrl }))
        : GITHUB_FALLBACK;

      setSelectedSource('github');
      setAudioFiles(files);
    } catch {
      setSelectedSource('github');
      setAudioFiles(GITHUB_FALLBACK);
    } finally {
      setIsLoadingSource(false);
    }
  };

  const GITHUB_FALLBACK: AudioFile[] = [
    { name: 'Are you alright?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/1.mp3' },
    { name: 'May I help you?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/2.mp3' },
    { name: 'Are you lost?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/3.mp3' },
    { name: 'Where are you from?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/4.mp3' },
    { name: 'Is it your first time in Japan?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/5.mp3' },
    { name: 'How long are you staying in Japan?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/6.mp3' },
    { name: 'Where are you staying?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/7.mp3' },
    { name: 'Please enjoy your trip in Japan.', url: 'https://raw.githubusercontent.com/masaki009/test123/main/8.mp3' },
    { name: 'Have you tried Monjayaki?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/9.mp3' },
    { name: 'Do you know where I can find ATM?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/10.mp3' },
    { name: 'Go down the street.', url: 'https://raw.githubusercontent.com/masaki009/test123/main/11.mp3' },
    { name: 'Could you tell me how to get Tokyo station?', url: 'https://raw.githubusercontent.com/masaki009/test123/main/13.mp3' },
  ];

  const handleStartPlaying = () => {
    if (selectedIndex === null) return;
    setCount(0);
    setBallPosition({ x: 50, y: 100, scale: 1 });
    setBatterSwing(false);
    setStage('playing');
  };

  const handleBatterClick = async () => {
    if (isPlaying || selectedIndex === null) return;
    const file = audioFiles[selectedIndex];
    if (!file) return;

    setIsPlaying(true);
    setBallPosition({ x: 50, y: 100, scale: 1 });
    setTimeout(() => setBallPosition({ x: 50, y: 15, scale: 0.25 }), 50);
    setTimeout(() => setBatterSwing(true), 600);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(file.url);
      audioRef.current = audio;
      await audio.play();
      setCount((prev) => prev + 1);
      audio.onended = () => {
        setIsPlaying(false);
        setBatterSwing(false);
        setBallPosition({ x: 50, y: 100, scale: 1 });
      };
    } catch {
      setIsPlaying(false);
      setBatterSwing(false);
      setBallPosition({ x: 50, y: 100, scale: 1 });
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCount(0);
    setBallPosition({ x: 50, y: 100, scale: 1 });
    setBatterSwing(false);
    setIsPlaying(false);
    setStage('ball-select');
  };

  const countStr = String(count).padStart(3, '0');

  // ---- Stage: source-select ----
  if (stage === 'source-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-green-800 flex flex-col">
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-white">音声100本ノック</h1>
            <div className="w-24" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">データソースを選ぶ</h2>
            <p className="text-sm text-gray-500 mb-6">再生する音声のソースを選択してください</p>

            {sourceError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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
                  disabled={isLoadingSource}
                  className={`py-5 px-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    selectedSource === 'notion_perfect'
                      ? 'bg-amber-500 ring-2 ring-amber-400 ring-offset-1'
                      : 'bg-amber-400 hover:bg-amber-500'
                  }`}
                >
                  Notion：完璧
                </button>
                <button
                  onClick={() => loadNotionSource('要復習', 'notion_review')}
                  disabled={isLoadingSource}
                  className={`py-5 px-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    selectedSource === 'notion_review'
                      ? 'bg-sky-500 ring-2 ring-sky-400 ring-offset-1'
                      : 'bg-sky-400 hover:bg-sky-500'
                  }`}
                >
                  Notion：要復習
                </button>
                <button
                  onClick={() => loadNotionSource('覚え中', 'notion_learning')}
                  disabled={isLoadingSource}
                  className={`py-5 px-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    selectedSource === 'notion_learning'
                      ? 'bg-teal-500 ring-2 ring-teal-400 ring-offset-1'
                      : 'bg-teal-400 hover:bg-teal-500'
                  }`}
                >
                  Notion：覚え中
                </button>
                <button
                  onClick={loadGithubSource}
                  disabled={isLoadingSource}
                  className={`py-5 px-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    selectedSource === 'github'
                      ? 'bg-green-600 ring-2 ring-green-400 ring-offset-1'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  センター
                </button>
              </div>
            )}

            {selectedSource && audioFiles.length > 0 && !isLoadingSource && (
              <>
                <div className="mt-5 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <span className="font-semibold">{SOURCE_LABELS[selectedSource]}</span>
                  {' '}を選択中 — {audioFiles.length}件取得
                </div>
                <button
                  onClick={() => setStage('ball-select')}
                  className="mt-4 w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-105 active:scale-100 flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  次へ
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---- Stage: ball-select ----
  if (stage === 'ball-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-green-800 flex flex-col">
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => { setSelectedIndex(null); setStage('source-select'); }}
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-white">音声100本ノック</h1>
            <div className="w-24" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-1">再生する音声を選ぶ</h2>
            {selectedSource && (
              <p className="text-xs text-gray-500 mb-4">
                {SOURCE_LABELS[selectedSource]} — {audioFiles.length}件
              </p>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8 max-h-80 overflow-y-auto pr-1">
              {audioFiles.map((file, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selectedIndex === i
                      ? 'border-yellow-400 bg-yellow-50 scale-105 shadow-lg'
                      : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <BallSVG size={48} highlight={selectedIndex === i} />
                  <span className="text-xs text-gray-700 text-center leading-tight line-clamp-2">
                    {file.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedIndex(null); setStage('source-select'); }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                ソース選択へ戻る
              </button>
              <button
                onClick={handleStartPlaying}
                disabled={selectedIndex === null}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-100 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play size={18} />
                スタート
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---- Stage: playing ----
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(170deg, #1a3a2a 0%, #0f5c3a 45%, #0a3f28 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.25) 0%, transparent 55%)' }}
      />

      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            選択に戻る
          </button>
          <h1 className="text-2xl font-bold text-white">音声100本ノック</h1>
          <div className="w-28" />
        </div>
      </header>

      <div className="relative z-10 flex-1 flex">
        {/* Counter panel */}
        <div className="flex flex-col items-center justify-center px-4 py-8 w-36 flex-shrink-0">
          <div
            className="rounded-xl p-4 shadow-2xl border border-yellow-700 w-full"
            style={{ background: '#0a0a0a' }}
          >
            <p
              className="text-xs font-bold text-center mb-3 tracking-widest uppercase"
              style={{ color: '#a16207', fontFamily: "'Courier New', monospace" }}
            >
              COUNT
            </p>
            <div
              className="text-center tracking-widest select-none"
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#facc15',
                textShadow: '0 0 10px #fbbf24, 0 0 20px #f59e0b',
                letterSpacing: '0.15em',
              }}
            >
              {countStr}
            </div>
            <div className="mt-3 text-center">
              <span
                className="text-xs"
                style={{ color: '#78716c', fontFamily: "'Courier New', monospace" }}
              >
                / 999
              </span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-6 w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
          >
            <RotateCcw size={12} />
            リセット
          </button>

          {selectedIndex !== null && audioFiles[selectedIndex] && (
            <div className="mt-4 px-2 py-2 bg-black/30 rounded-lg border border-white/10 w-full">
              <p
                className="text-xs text-center leading-tight break-all line-clamp-3"
                style={{ color: '#86efac', fontFamily: "'Courier New', monospace" }}
              >
                {audioFiles[selectedIndex].name}
              </p>
            </div>
          )}
        </div>

        {/* Baseball field */}
        <div className="flex-1 relative flex items-center justify-center">
          <div className="relative w-full max-w-2xl h-[500px]">
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer select-none"
              onClick={handleBatterClick}
              style={{ pointerEvents: isPlaying ? 'none' : 'auto' }}
            >
              <img
                src={batterSwing ? '/batter2.png' : '/batter1.png'}
                alt="バッター"
                className={`h-[400px] w-auto object-contain filter drop-shadow-lg transition-opacity duration-100 ${
                  isPlaying ? 'opacity-80' : 'hover:opacity-95'
                }`}
                style={{ imageRendering: 'auto', userSelect: 'none' }}
                draggable={false}
              />
            </div>

            <div
              className="absolute transition-all duration-700 ease-in-out pointer-events-none"
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
                style={{ imageRendering: 'auto' }}
                draggable={false}
              />
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-5 py-2 border border-white/10">
              <p className="text-white/70 text-sm text-center">
                {isPlaying ? '再生中...' : 'バッターをクリックして音声を再生'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default Audio100Knock