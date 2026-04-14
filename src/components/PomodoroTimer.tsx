import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Minimize2, Maximize2, X, ArrowLeft } from 'lucide-react';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  totalSessions: number;
}

type PomodoroTimerProps = {
  onBack?: () => void;
};

const WORK_DURATION = 25 * 60;
const SHORT_BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

export function PomodoroTimer({ onBack }: PomodoroTimerProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [sessionCount, setSessionCount] = useState<number>(4);
  const [currentSession, setCurrentSession] = useState(0);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBreakFullscreen, setIsBreakFullscreen] = useState(false);
  const [showBreakWarning, setShowBreakWarning] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const audioRef = useRef<HTMLAudioElement>(null);
  const breakAudioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateTotalTime = (sessions: number): string => {
    const workTime = sessions * WORK_DURATION;
    const shortBreaks = Math.max(0, sessions - 1);
    const breakTime = shortBreaks * SHORT_BREAK_DURATION;
    const totalSeconds = workTime + breakTime;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}時間${minutes}分`;
  };

  const handleStart = () => {
    if (sessionCount < 1) {
      alert('セッション数は1以上を入力してください');
      return;
    }
    setIsStarted(true);
    setCurrentSession(1);
    setSessionType('work');
    setTimeLeft(WORK_DURATION);
    setIsRunning(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isBreakFullscreen) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }

          if (sessionType !== 'work' && prev === 31) {
            setShowBreakWarning(true);
            setTimeout(() => setShowBreakWarning(false), 5000);
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, sessionType]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    playNotificationSound();

    if (sessionType === 'work') {
      if (currentSession >= sessionCount) {
        alert('すべてのセッションが完了しました！お疲れ様でした！');
        handleReset();
        return;
      }

      const nextBreakType = currentSession % 4 === 0 ? 'longBreak' : 'shortBreak';
      setSessionType(nextBreakType);
      setTimeLeft(nextBreakType === 'longBreak' ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION);
      setIsBreakFullscreen(true);
      playBreakBGM();
      setIsRunning(true);
    } else {
      setSessionType('work');
      setTimeLeft(WORK_DURATION);
      setCurrentSession(prev => prev + 1);
      setIsBreakFullscreen(false);
      stopBreakBGM();
      setIsRunning(true);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const playBreakBGM = () => {
    if (breakAudioRef.current) {
      breakAudioRef.current.play().catch(e => console.log('BGM play failed:', e));
    }
  };

  const stopBreakBGM = () => {
    if (breakAudioRef.current) {
      breakAudioRef.current.pause();
      breakAudioRef.current.currentTime = 0;
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsStarted(false);
    setCurrentSession(0);
    setSessionType('work');
    setTimeLeft(WORK_DURATION);
    setIsBreakFullscreen(false);
    stopBreakBGM();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionLabel = (): string => {
    switch (sessionType) {
      case 'work':
        return '作業中';
      case 'shortBreak':
        return '休憩中';
      case 'longBreak':
        return '長い休憩中';
      default:
        return '';
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
          {onBack && (
            <div className="mb-6">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <ArrowLeft size={18} />
                戻る
              </button>
            </div>
          )}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍅</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ポモドーロタイマー</h1>
            <p className="text-gray-600">集中して効率的に学習しましょう</p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              セッション数
            </label>
            <input
              type="number"
              min="1"
              value={sessionCount}
              onChange={(e) => setSessionCount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 text-lg text-center font-semibold"
              placeholder="セッション数を入力"
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              総実行時間: {calculateTotalTime(sessionCount)}
            </p>
          </div>

          <div className="space-y-4 mb-8 bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">作業時間</span>
              <span className="font-semibold text-gray-800">25分</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">短い休憩</span>
              <span className="font-semibold text-gray-800">5分</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">長い休憩</span>
              <span className="font-semibold text-gray-800">15分</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-rose-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
          >
            スタート
          </button>
        </div>

        <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmm98OScTgwOUKXh8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8Q==" />
      </div>
    );
  }

  if (isBreakFullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute inset-0">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/lP26UCnoH9s?autoplay=1&mute=0&controls=0&loop=1&playlist=lP26UCnoH9s"
            title="Relaxing Nature Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full object-cover"
          />
        </div>

        {showBreakWarning && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            休憩終了まであと30秒です
          </div>
        )}

        <div
          className="absolute bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 cursor-move"
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          onMouseDown={handleMouseDown}
        >
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">{getSessionLabel()}</div>
            <div className="text-4xl font-bold text-rose-600 mb-4">{formatTime(timeLeft)}</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={toggleTimer}
                className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        </div>

        <audio ref={breakAudioRef} loop src="https://assets.mixkit.co/music/preview/mixkit-relaxing-nature-ambience-2335.mp3" />
        <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmm98OScTgwOUKXh8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8Q==" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed bg-white rounded-2xl shadow-2xl transition-all ${
          isMinimized ? 'w-16 h-16' : 'w-72'
        } cursor-move z-40`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleMouseDown}
      >
        {isMinimized ? (
          <div
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center text-2xl cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors"
          >
            🍅
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-xl">🍅</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Minimize2 size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={16} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-sm font-medium text-gray-600 mb-1">
                セッション {currentSession}/{sessionCount}
              </div>
              <div className="text-xs text-gray-500 mb-3">{getSessionLabel()}</div>
              <div className="text-5xl font-bold text-rose-600 mb-4">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={toggleTimer}
                className="flex-1 p-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
                {isRunning ? '一時停止' : '再開'}
              </button>
              <button
                onClick={handleReset}
                className="p-3 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmm98OScTgwOUKXh8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8bllGwU7k9n0y3gqBSl+zPLaizsIHGvB8+SbTAsNT6Lf8Q==" />
    </>
  );
}
