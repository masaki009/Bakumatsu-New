import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, RotateCcw, CheckCircle } from 'lucide-react';

interface ScoringResult {
  accuracy: number;
  speedScore: number;
  fluency: number;
  totalScore: number;
  wpm: number;
  recognizedText: string;
}

interface EnglishConversationAvatarProps {
  onBack: () => void;
}

const SAMPLE_PHRASES = [
  "Hello, how are you doing today?",
  "I love learning English every day.",
  "The weather is beautiful this morning.",
  "Can you help me with this problem?",
  "Practice makes perfect in everything.",
  "I'm looking forward to seeing you soon.",
  "Thank you very much for your kindness.",
  "It's a pleasure to meet you here.",
];

export default function EnglishConversationAvatar({ onBack }: EnglishConversationAvatarProps) {
  const [currentPhrase, setCurrentPhrase] = useState(SAMPLE_PHRASES[0]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [speechStartTime, setSpeechStartTime] = useState<number>(0);
  const [totalSpeechDuration, setTotalSpeechDuration] = useState<number>(0);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [isSpeechRecognitionAvailable, setIsSpeechRecognitionAvailable] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number>();
  const lastSoundTimeRef = useRef<number>(0);
  const currentRecognizedTextRef = useRef<string>('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSpeechRecognitionAvailable(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setStartTime(Date.now());
        setSpeechStartTime(0);
        setTotalSpeechDuration(0);
        lastSoundTimeRef.current = Date.now();
        currentRecognizedTextRef.current = '';
      };

      recognition.onresult = (event: any) => {
        if (speechStartTime === 0) {
          setSpeechStartTime(Date.now());
        }
        lastSoundTimeRef.current = Date.now();

        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setRecognizedText(transcript);
        currentRecognizedTextRef.current = transcript;

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = window.setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 2000);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        let errorMessage = '音声認識エラーが発生しました';
        switch (event.error) {
          case 'network':
            errorMessage = 'ネットワークエラーです。インターネット接続を確認してください。';
            break;
          case 'not-allowed':
            errorMessage = 'マイクの使用が許可されていません。ブラウザの設定を確認してください。';
            break;
          case 'no-speech':
            errorMessage = '音声が検出されませんでした。もう一度お試しください。';
            break;
          case 'aborted':
            errorMessage = '音声認識がキャンセルされました。';
            break;
          case 'audio-capture':
            errorMessage = 'マイクが見つかりません。マイクの接続を確認してください。';
            break;
          case 'service-not-allowed':
            errorMessage = 'HTTPSでアクセスしてください。音声認識はHTTPSが必要です。';
            break;
        }
        setError(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalText = currentRecognizedTextRef.current;
        if (finalText && finalText.trim()) {
          calculateScore(finalText);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechRecognitionAvailable(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const calculateScore = (recognized: string) => {
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    const speechDuration = speechStartTime > 0 ? (endTime - speechStartTime) / 1000 : totalDuration;

    const originalWords = currentPhrase.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const recognizedWords = recognized.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    let matchCount = 0;
    originalWords.forEach((word, index) => {
      if (recognizedWords[index] && recognizedWords[index].includes(word.replace(/[.,!?]/g, ''))) {
        matchCount++;
      }
    });

    const accuracy = Math.round((matchCount / originalWords.length) * 100);

    const wpm = Math.round((recognizedWords.length / totalDuration) * 60);
    let speedScore = 0;
    if (wpm >= 120 && wpm <= 180) {
      speedScore = 100;
    } else if (wpm >= 90 && wpm < 120) {
      speedScore = 80 + ((wpm - 90) / 30) * 20;
    } else if (wpm >= 180 && wpm < 210) {
      speedScore = 80 + ((210 - wpm) / 30) * 20;
    } else if (wpm >= 60 && wpm < 90) {
      speedScore = 50 + ((wpm - 60) / 30) * 30;
    } else if (wpm >= 210 && wpm < 240) {
      speedScore = 50 + ((240 - wpm) / 30) * 30;
    } else {
      speedScore = 30;
    }
    speedScore = Math.round(speedScore);

    const fluencyRatio = speechDuration / totalDuration;
    let fluency = 0;
    if (fluencyRatio >= 0.8) {
      fluency = 100;
    } else if (fluencyRatio >= 0.6) {
      fluency = 70 + ((fluencyRatio - 0.6) / 0.2) * 30;
    } else if (fluencyRatio >= 0.4) {
      fluency = 40 + ((fluencyRatio - 0.4) / 0.2) * 30;
    } else {
      fluency = fluencyRatio * 100;
    }
    fluency = Math.round(fluency);

    const totalScore = Math.round((accuracy * 0.4) + (speedScore * 0.3) + (fluency * 0.3));

    setScoringResult({
      accuracy,
      speedScore,
      fluency,
      totalScore,
      wpm,
      recognizedText: recognized,
    });
  };

  const handleMicClick = async () => {
    if (!recognitionRef.current) {
      setError('お使いのブラウザは音声認識に対応していません');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError('');
      setRecognizedText('');
      setScoringResult(null);

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Microphone access error:', err);
        setError('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
      }
    }
  };

  const handleNewPhrase = () => {
    const newPhrase = SAMPLE_PHRASES[Math.floor(Math.random() * SAMPLE_PHRASES.length)];
    setCurrentPhrase(newPhrase);
    setRecognizedText('');
    setTextInput('');
    setScoringResult(null);
    setError('');
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      setError('テキストを入力してください');
      return;
    }
    setError('');
    setStartTime(Date.now() - 2000);
    setSpeechStartTime(Date.now() - 1500);
    calculateScore(textInput);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-300';
    if (score >= 60) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white border-b border-indigo-200 shadow-sm">
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
              <h1 className="text-3xl font-bold text-indigo-600 mb-1">English Pronunciation Scoring</h1>
              <p className="text-sm text-gray-600">発音スコアリング</p>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-indigo-600">お手本フレーズ</h2>
              <button
                onClick={handleNewPhrase}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-300"
              >
                <RotateCcw size={16} />
                別のフレーズ
              </button>
            </div>
            <div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-300">
              <p className="text-2xl text-gray-800 text-center font-medium leading-relaxed">
                {currentPhrase}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-6">
            {isSpeechRecognitionAvailable && (
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    inputMode === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  テキスト入力
                </button>
                <button
                  onClick={() => setInputMode('voice')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    inputMode === 'voice'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  音声入力
                </button>
              </div>
            )}

            {inputMode === 'text' ? (
              <div className="flex flex-col items-center space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="お手本フレーズを入力してください..."
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleTextSubmit}
                  className="px-8 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
                >
                  採点する
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={handleMicClick}
                  disabled={isListening && !recognizedText}
                  className={`relative w-24 h-24 rounded-full shadow-2xl transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-red-500 animate-pulse shadow-red-500/50'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                  }`}
                >
                  <Mic className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" size={40} />
                  {isListening && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
                  )}
                </button>

                <p className="text-sm text-gray-600 text-center max-w-md">
                  {isListening ? '話し終わると自動で採点されます' : 'マイクボタンを押してお手本を読み上げてください'}
                </p>

                {recognizedText && (
                  <div className="w-full bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">認識されたテキスト:</p>
                    <p className="text-lg text-gray-900">{recognizedText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {scoringResult && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-6">
              <h2 className="text-2xl font-bold text-indigo-600 mb-6 flex items-center gap-2">
                <CheckCircle size={24} />
                スコア結果
              </h2>

              <div className="mb-4 bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">入力されたテキスト:</p>
                <p className="text-lg text-gray-900">{scoringResult.recognizedText}</p>
              </div>

              <div className="space-y-4">
                <div className={`rounded-lg p-4 border-2 ${getScoreBgColor(scoringResult.accuracy)}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">単語一致率</span>
                    <span className={`text-2xl font-bold ${getScoreColor(scoringResult.accuracy)}`}>
                      {scoringResult.accuracy}点
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">お手本vs認識テキストの一致度</p>
                </div>

                <div className={`rounded-lg p-4 border-2 ${getScoreBgColor(scoringResult.speedScore)}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">スピードスコア</span>
                    <span className={`text-2xl font-bold ${getScoreColor(scoringResult.speedScore)}`}>
                      {scoringResult.speedScore}点
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    1分あたりの単語数: {scoringResult.wpm} WPM (最適: 120-180 WPM)
                  </p>
                </div>

                <div className={`rounded-lg p-4 border-2 ${getScoreBgColor(scoringResult.fluency)}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">流暢さ</span>
                    <span className={`text-2xl font-bold ${getScoreColor(scoringResult.fluency)}`}>
                      {scoringResult.fluency}点
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">話しより・無音区間の検出</p>
                </div>

                <div className={`rounded-lg p-6 border-4 ${getScoreBgColor(scoringResult.totalScore)}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">総合スコア</span>
                    <span className={`text-4xl font-bold ${getScoreColor(scoringResult.totalScore)}`}>
                      {scoringResult.totalScore}点
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">上記を合計して100点満点</p>
                </div>
              </div>
            </div>
          )}

          {!isSpeechRecognitionAvailable && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ お使いのブラウザは音声認識に対応していません。テキスト入力モードをご利用ください。
              </p>
            </div>
          )}

          {isSpeechRecognitionAvailable && inputMode === 'voice' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                ⚠️ 音声入力にはHTTPSでの接続とマイクの許可が必要です。うまく動作しない場合はテキスト入力モードをお試しください。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
