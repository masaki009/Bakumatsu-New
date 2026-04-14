import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Square, Clipboard, Volume2, ChevronDown, ChevronUp, RotateCcw, Eye, EyeOff, X, Languages } from 'lucide-react';

interface EnglishListeningPracticeProps {
  onBack: () => void;
}

type PlaybackState = 'idle' | 'playing' | 'paused';

export default function EnglishListeningPractice({ onBack }: EnglishListeningPracticeProps) {
  const [text, setText] = useState('');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [katakanaText, setKatakanaText] = useState('');
  const [showKatakana, setShowKatakana] = useState(false);
  const [loadingKatakana, setLoadingKatakana] = useState(false);
  const [katakanaError, setKatakanaError] = useState('');
  const [japaneseText, setJapaneseText] = useState('');
  const [showJapanese, setShowJapanese] = useState(false);
  const [loadingJapanese, setLoadingJapanese] = useState(false);
  const [japaneseError, setJapaneseError] = useState('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordPositionsRef = useRef<number[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const englishVoices = availableVoices.filter(voice => voice.lang.startsWith('en'));
      setVoices(englishVoices);

      const usEnglishVoice = englishVoices.find(voice =>
        voice.lang.includes('US') || voice.lang.includes('en-US')
      ) || englishVoices[0];

      if (usEnglishVoice) {
        setSelectedVoice(usEnglishVoice);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      if (playbackState === 'playing') {
        handleStop();
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleClear = () => {
    setText('');
    setKatakanaText('');
    setShowKatakana(false);
    setJapaneseText('');
    setShowJapanese(false);
    if (playbackState === 'playing') {
      handleStop();
    }
  };

  const getRateLabel = (rate: number): string => {
    if (rate < 0.7) return '遅い';
    if (rate > 1.3) return '速い';
    return '普通';
  };

  const handlePlay = () => {
    if (!text.trim() || !selectedVoice) return;

    if (playbackState === 'paused') {
      speechSynthesis.resume();
      setPlaybackState('playing');
      return;
    }

    speechSynthesis.cancel();

    const currentText = text.trim();

    // 各単語の開始位置を記録
    const words: string[] = [];
    const positions: number[] = [];
    const regex = /\S+/g;
    let match;

    while ((match = regex.exec(currentText)) !== null) {
      words.push(match[0]);
      positions.push(match.index);
    }

    wordsRef.current = words;
    wordPositionsRef.current = positions;

    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = selectedVoice.lang;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // charIndexを使って、どの単語が話されているかを特定
        const charIndex = event.charIndex;
        let wordIndex = -1;

        for (let i = 0; i < wordPositionsRef.current.length; i++) {
          if (wordPositionsRef.current[i] <= charIndex) {
            wordIndex = i;
          } else {
            break;
          }
        }

        if (wordIndex >= 0) {
          setCurrentWordIndex(wordIndex);
        }
      }
    };

    utterance.onend = () => {
      setPlaybackState('idle');
      setCurrentWordIndex(-1);
    };

    utterance.onerror = () => {
      setPlaybackState('idle');
      setCurrentWordIndex(-1);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setPlaybackState('playing');
    setCurrentWordIndex(0);
  };

  const handlePause = () => {
    speechSynthesis.pause();
    setPlaybackState('paused');
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setPlaybackState('idle');
    setCurrentWordIndex(-1);
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    // テキストが変更されたらキャッシュをクリア
    setKatakanaText('');
    setShowKatakana(false);
    setJapaneseText('');
    setShowJapanese(false);
    if (playbackState === 'playing' || playbackState === 'paused') {
      handleStop();
    }
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (playbackState === 'playing' || playbackState === 'paused') {
      handleStop();
    }
  };

  const convertToKatakana = async () => {
    if (!text.trim()) return;

    // すでに表示されている場合は非表示にする
    if (showKatakana && katakanaText) {
      setShowKatakana(false);
      return;
    }

    // すでに変換済みの場合は表示するだけ
    if (katakanaText) {
      setShowKatakana(true);
      return;
    }

    setLoadingKatakana(true);
    setKatakanaError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/katakana-converter`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: text.trim()
        })
      });

      if (!response.ok) {
        throw new Error('変換に失敗しました');
      }

      const data = await response.json();
      setKatakanaText(data.katakana);
      setShowKatakana(true);
    } catch (error) {
      console.error('Katakana conversion error:', error);
      setKatakanaError('変換に失敗しました。再試行してください。');
    } finally {
      setLoadingKatakana(false);
    }
  };

  const convertToJapanese = async () => {
    if (!text.trim()) return;

    // すでに表示されている場合は非表示にする
    if (showJapanese && japaneseText) {
      setShowJapanese(false);
      return;
    }

    // すでに変換済みの場合は表示するだけ
    if (japaneseText) {
      setShowJapanese(true);
      return;
    }

    setLoadingJapanese(true);
    setJapaneseError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/english-to-japanese`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: text.trim()
        })
      });

      if (!response.ok) {
        throw new Error('変換に失敗しました');
      }

      const data = await response.json();
      setJapaneseText(data.translation);
      setShowJapanese(true);
    } catch (error) {
      console.error('Japanese conversion error:', error);
      setJapaneseError('変換に失敗しました。再試行してください。');
    } finally {
      setLoadingJapanese(false);
    }
  };

  const words = text.trim().split(/\s+/).filter(w => w.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-yellow-50">
      <header className="bg-white border-b border-orange-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-orange-600 mb-1">英語リスニング練習</h1>
              <p className="text-sm text-gray-600">English Listening Practice</p>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Text Input Section */}
        <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-orange-600">テキスト入力</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePaste}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <Clipboard size={18} />
                ペースト
              </button>
              <button
                onClick={handleClear}
                disabled={!text.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <X size={18} />
                クリア
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="英文を入力してください..."
            className="w-full h-40 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
            style={{ fontSize: '22px' }}
          />
        </div>

        {/* Katakana Section */}
        <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-orange-600">カタカナ読み（音節読み）</h2>
            <button
              onClick={convertToKatakana}
              disabled={loadingKatakana || !text.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <Volume2 size={18} />
              {loadingKatakana ? '変換中...' : showKatakana ? 'カタカナ非表示' : 'カタカナ表示'}
            </button>
          </div>

          {showKatakana && (
            <div className="mt-4 p-6 bg-orange-50 border-2 border-orange-200 rounded-lg">
              {loadingKatakana && (
                <div className="text-center">
                  <div className="inline-block animate-pulse text-orange-600 font-medium">変換中...</div>
                </div>
              )}

              {katakanaError && (
                <div className="flex items-center justify-between bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{katakanaError}</p>
                  <button
                    onClick={convertToKatakana}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    <RotateCcw size={14} />
                    再試行
                  </button>
                </div>
              )}

              {!loadingKatakana && !katakanaError && katakanaText && (
                <div className="text-orange-900 font-sans text-xl leading-relaxed">
                  {katakanaText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg">
          <h2 className="text-xl font-semibold text-orange-600 mb-6">コントロール</h2>

          <div className="flex gap-6">
            {/* Left Side: Controls */}
            <div className="flex-1 space-y-6">
              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音声選択
                </label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = voices.find(v => v.name === e.target.value);
                    setSelectedVoice(voice || null);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  速度: {rate.toFixed(1)}× <span className="text-orange-600 font-semibold">({getRateLabel(rate)})</span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>

            {/* Right Side: Buttons */}
            <div className="w-48 flex flex-col gap-3">
              {playbackState !== 'playing' ? (
                <button
                  onClick={handlePlay}
                  disabled={!text.trim() || !selectedVoice}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-md"
                >
                  <Play size={20} />
                  {playbackState === 'paused' ? '再開' : '再生'}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors shadow-md"
                >
                  <Pause size={20} />
                  一時停止
                </button>
              )}

              <button
                onClick={handleStop}
                disabled={playbackState === 'idle'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-md"
              >
                <Square size={20} />
                停止
              </button>

              <button
                onClick={convertToJapanese}
                disabled={loadingJapanese || !text.trim()}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-md"
              >
                <Languages size={20} />
                {loadingJapanese ? '変換中...' : showJapanese ? '和訳非表示' : '和訳'}
              </button>
            </div>
          </div>
        </div>

        {/* Japanese Translation */}
        {showJapanese && (
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-lg">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">和訳</h2>
            {loadingJapanese && (
              <div className="text-center">
                <div className="inline-block animate-pulse text-blue-600 font-medium">変換中...</div>
              </div>
            )}

            {japaneseError && (
              <div className="flex items-center justify-between bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-red-700 text-sm">{japaneseError}</p>
                <button
                  onClick={convertToJapanese}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  <RotateCcw size={14} />
                  再試行
                </button>
              </div>
            )}

            {!loadingJapanese && !japaneseError && japaneseText && (
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="text-gray-900 font-sans text-lg leading-relaxed">
                  {japaneseText}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
