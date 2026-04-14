import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { Copy, Trash2, Play, Square, Type, Save, ArrowLeft } from 'lucide-react';
import { getJSTDate } from '../utils/dateUtils';

interface ExReadingProps {
  onBack?: () => void;
}

export default function ExReading({ onBack }: ExReadingProps) {
  const { user } = useAuth();
  useVitalSync({ userId: user?.id });
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmChoice, setConfirmChoice] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    if (text) {
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [text]);

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning) {
      interval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch (error) {
      setMessage({ type: 'error', text: 'クリップボードへのアクセスに失敗しました' });
    }
  };

  const handleClear = () => {
    setText('');
    setWordCount(0);
    setWpm(0);
    setElapsedTime(0);
    setIsRunning(false);
    setIsReadingAloud(false);
  };

  const handleStart = () => {
    setIsRunning(true);
    setElapsedTime(0);
    setWpm(0);
  };

  const handleEnd = () => {
    setIsRunning(false);
    if (elapsedTime > 0 && wordCount > 0) {
      const minutes = elapsedTime / 60;
      const calculatedWpm = Math.round(wordCount / minutes);
      setWpm(calculatedWpm);
    }
  };

  const cycleFontSize = () => {
    const sizes = [20, 22, 26, 28];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setFontSize(sizes[nextIndex]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!user?.email) {
      setMessage({ type: 'error', text: 'ユーザー情報が取得できません' });
      return;
    }

    if (wordCount === 0 || wpm === 0) {
      setMessage({ type: 'error', text: 'Word数とWPMを記録してください' });
      return;
    }

    setShowConfirmDialog(true);
    setConfirmChoice(null);
  };

  const handleConfirmSave = async () => {
    if (confirmChoice !== 'yes') {
      setShowConfirmDialog(false);
      return;
    }

    setShowConfirmDialog(false);
    setLoading(true);
    setMessage(null);

    try {
      const today = getJSTDate();

      const { error } = await supabase
        .from('ex_reading')
        .insert({
          user_id: user.id,
          email: user.email,
          reading_date: today,
          words: wordCount,
          wpm: wpm,
          is_reading_aloud: isReadingAloud
        });

      if (error) throw error;

      const { data: diaryData, error: diaryError } = await supabase
        .from('s_diaries')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!diaryError && diaryData) {
        const { error: updateDiaryError } = await supabase
          .from('s_diaries')
          .update({
            ex_reading: diaryData.ex_reading + wordCount
          })
          .eq('user_id', user.id);

        if (updateDiaryError) {
          console.error('Error updating s_diaries:', updateDiaryError);
        }
      } else {
        const { error: insertDiaryError } = await supabase
          .from('s_diaries')
          .insert({
            user_id: user.id,
            email: user.email,
            date: today,
            ex_reading: wordCount
          });

        if (insertDiaryError) {
          console.error('Error inserting s_diaries:', insertDiaryError);
        }
      }

      setMessage({
        type: 'success',
        text: 'リーディング結果を保存しました'
      });
      setTimeout(() => setMessage(null), 3000);

      handleClear();
    } catch (error: any) {
      console.error('Error saving reading record:', error);
      setMessage({ type: 'error', text: error.message || '保存中にエラーが発生しました' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6">
      <div className="max-w-5xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
          >
            <ArrowLeft size={18} />
            戻る
          </button>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">📖 多読速読音読チャレンジ</h1>
            {message && (
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          <div className="mb-6" style={{ height: '50vh' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ここにテキストを貼り付けるか、入力してください..."
              className="w-full h-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
            />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <button
              onClick={handlePaste}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
            >
              <Copy size={18} />
              ペースト
            </button>

            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
            >
              <Trash2 size={18} />
              クリア
            </button>

            <div className="flex items-center justify-center px-4 py-3 bg-orange-100 text-orange-800 rounded-lg font-semibold border-2 border-orange-300">
              Words: {wordCount}
            </div>

            <div className="flex items-center justify-center px-4 py-3 bg-orange-100 text-orange-800 rounded-lg font-semibold border-2 border-orange-300">
              WPM: {wpm}
            </div>

            <button
              onClick={handleStart}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-full hover:bg-teal-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} />
              速読START
            </button>

            <button
              onClick={handleEnd}
              disabled={!isRunning}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-full hover:bg-teal-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square size={18} />
              速読END
            </button>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 flex-1 px-4 py-3 bg-blue-100 text-blue-800 rounded-lg border-2 border-blue-300 cursor-pointer hover:bg-blue-200 transition">
                <input
                  type="checkbox"
                  checked={isReadingAloud}
                  onChange={(e) => setIsReadingAloud(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="font-semibold">音読</span>
              </label>
              <button
                onClick={cycleFontSize}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
              >
                <Type size={18} />
                <span>{fontSize}px</span>
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || wordCount === 0 || wpm === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              記録
            </button>
          </div>

          <div className="flex items-center justify-center py-3 bg-gray-100 rounded-lg">
            <span className="text-xl font-mono font-bold text-gray-700">
              Time: {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                記録しますか？
              </h2>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="radio"
                    name="confirm"
                    value="yes"
                    checked={confirmChoice === 'yes'}
                    onChange={() => setConfirmChoice('yes')}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="text-lg font-semibold text-gray-700">はい</span>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-red-50 transition">
                  <input
                    type="radio"
                    name="confirm"
                    value="no"
                    checked={confirmChoice === 'no'}
                    onChange={() => setConfirmChoice('no')}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="text-lg font-semibold text-gray-700">いいえ</span>
                </label>
              </div>

              <button
                onClick={handleConfirmSave}
                disabled={confirmChoice === null}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                確定
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
