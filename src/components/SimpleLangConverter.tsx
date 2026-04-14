import { useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, RotateCcw, Languages, Loader2 } from 'lucide-react';

interface SimplifiedJapanese {
  japanese: string;
  reading: string;
  explanation: string;
}

interface JapaneseSimplifyResponse {
  original: string;
  simplified: SimplifiedJapanese[];
}

interface EnglishSuggestion {
  english: string;
  key_words: string[];
  japanese_note: string;
}

interface EnglishConvertResponse {
  source: string;
  english_suggestions: EnglishSuggestion[];
}

interface SimpleLangConverterProps {
  onBack: () => void;
}

export default function SimpleLangConverter({ onBack }: SimpleLangConverterProps) {
  const [inputText, setInputText] = useState('');
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [japaneseResults, setJapaneseResults] = useState<JapaneseSimplifyResponse[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [englishResults, setEnglishResults] = useState<EnglishConvertResponse[]>([]);

  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleJapaneseSimplify = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const inputs = inputText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simple-language-converter`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'japanese-simplify',
          input: inputs,
        }),
      });

      if (!response.ok) {
        throw new Error(`API呼び出しに失敗しました: ${response.status}`);
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];
      setJapaneseResults(results);
      setSelectedIndices(new Array(results.length).fill(-1));
      setCurrentStep(1);
    } catch (err) {
      console.error('Error simplifying Japanese:', err);
      setError('日本語の変換に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnglishConvert = async () => {
    const selectedPhrases = japaneseResults
      .map((result, idx) => selectedIndices[idx] >= 0 ? result.simplified[selectedIndices[idx]].japanese : null)
      .filter(phrase => phrase !== null) as string[];

    if (selectedPhrases.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simple-language-converter`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'english-convert',
          input: selectedPhrases,
        }),
      });

      if (!response.ok) {
        throw new Error(`API呼び出しに失敗しました: ${response.status}`);
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];
      setEnglishResults(results);
      setCurrentStep(2);
    } catch (err) {
      console.error('Error converting to English:', err);
      setError('英語への変換に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInputText('');
    setCurrentStep(1);
    setJapaneseResults([]);
    setSelectedIndices([]);
    setEnglishResults([]);
    setError(null);
  };

  const handleCopy = async (text: string, index: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleSelection = (resultIdx: number, optionIdx: number) => {
    setSelectedIndices(prev => {
      const newIndices = [...prev];
      newIndices[resultIdx] = newIndices[resultIdx] === optionIdx ? -1 : optionIdx;
      return newIndices;
    });
  };

  const allSelected = selectedIndices.every(idx => idx >= 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Languages className="w-7 h-7 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              やさしい言葉変換アプリ
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            currentStep === 1 ? 'bg-yellow-100 border-2 border-yellow-500 shadow-md' : 'bg-gray-100 border-2 border-gray-300'
          }`}>
            <span className="font-bold text-lg">STEP 1</span>
            <span className="text-sm">にほんご</span>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-400" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            currentStep === 2 ? 'bg-sky-100 border-2 border-sky-500 shadow-md' : 'bg-gray-100 border-2 border-gray-300'
          }`}>
            <span className="font-bold text-lg">STEP 2</span>
            <span className="text-sm">えいご</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {japaneseResults.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-yellow-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              日本語の単語や表現を入力してください
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              難しい言葉を1行に1つずつ入れてください。複数の言葉を一度に変換できます。
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="例）&#10;憂鬱&#10;曖昧な返答&#10;逡巡する"
              className="w-full h-40 p-4 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-lg"
              disabled={isLoading}
            />
            <button
              onClick={handleJapaneseSimplify}
              disabled={!inputText.trim() || isLoading}
              className="mt-4 w-full sm:w-auto px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  変換中...
                </>
              ) : (
                <>
                  やさしい日本語に言い換える
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ) : currentStep === 1 ? (
          <div className="space-y-8">
            {japaneseResults.map((result, resultIdx) => (
              <div key={resultIdx} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500">元の言葉:</span>
                  <h3 className="text-xl font-bold text-gray-800">{result.original}</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {result.simplified.map((option, optionIdx) => (
                    <button
                      key={optionIdx}
                      onClick={() => toggleSelection(resultIdx, optionIdx)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedIndices[resultIdx] === optionIdx
                          ? 'border-yellow-500 bg-yellow-50 shadow-md scale-105'
                          : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xl font-bold text-gray-800">{option.japanese}</div>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                          selectedIndices[resultIdx] === optionIdx
                            ? 'border-yellow-500 bg-yellow-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedIndices[resultIdx] === optionIdx && (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">{option.reading}</div>
                      <div className="text-xs text-gray-600">{option.explanation}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
                最初からやり直す
              </button>
              <button
                onClick={handleEnglishConvert}
                disabled={!allSelected || isLoading}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    変換中...
                  </>
                ) : (
                  <>
                    えらんだ日本語を英語にする
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {englishResults.map((result, resultIdx) => (
              <div key={resultIdx} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-sky-200">
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500">元の日本語:</span>
                  <h3 className="text-xl font-bold text-gray-800">{result.source}</h3>
                </div>

                <div className="space-y-4">
                  {result.english_suggestions.map((suggestion, suggestionIdx) => (
                    <div
                      key={suggestionIdx}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl font-bold text-gray-800 flex-1">{suggestion.english}</div>
                        <button
                          onClick={() => handleCopy(suggestion.english, `${resultIdx}-${suggestionIdx}`)}
                          className="ml-3 p-2 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors flex-shrink-0"
                          title="コピー"
                        >
                          {copiedIndex === `${resultIdx}-${suggestionIdx}` ? (
                            <span className="text-xs font-bold text-sky-700 px-1">✓</span>
                          ) : (
                            <Copy className="w-4 h-4 text-sky-700" />
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {suggestion.key_words.map((word, wordIdx) => (
                          <span
                            key={wordIdx}
                            className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">{suggestion.japanese_note}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
                最初からやり直す
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
