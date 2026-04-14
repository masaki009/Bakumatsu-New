import { useState } from 'react';
import WordOrderQuizSetup from './WordOrderQuizSetup';
import WordOrderQuizQuestion from './WordOrderQuizQuestion';
import WordOrderQuizResults from './WordOrderQuizResults';

interface Question {
  japanese: string;
  blocks: string[];
  answer: string[];
  english: string;
  hint: string;
}

type Screen = 'setup' | 'quiz' | 'results';

interface Props {
  onBack: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function WordOrderQuiz({ onBack }: Props) {
  const [screen, setScreen] = useState<Screen>('setup');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placedBlocks, setPlacedBlocks] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/word-order-quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ genres: selectedGenres, difficulty }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API error');
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('問題の取得に失敗しました');
      }
      return data.questions as Question[];
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const q = await fetchQuestions();
      setQuestions(q);
      setCurrentIndex(0);
      setPlacedBlocks([]);
      setScore(0);
      setScreen('quiz');
    } catch (e: any) {
      setError(e.message || '問題の生成に失敗しました。もう一度お試しください。');
    }
  };

  const handlePlaceBlock = (word: string) => {
    setPlacedBlocks((prev) => [...prev, word]);
  };

  const handleRemoveBlock = (index: number) => {
    setPlacedBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = (isCorrect: boolean) => {
    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);

    if (currentIndex + 1 >= questions.length) {
      setScreen('results');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setPlacedBlocks([]);
    }
  };

  const handleContinue = async () => {
    try {
      const q = await fetchQuestions();
      setQuestions(q);
      setCurrentIndex(0);
      setPlacedBlocks([]);
      setScore(0);
      setScreen('quiz');
    } catch (e: any) {
      setError(e.message || '問題の生成に失敗しました。');
      setScreen('setup');
    }
  };

  const handleRestart = () => {
    setSelectedGenres([]);
    setDifficulty('');
    setQuestions([]);
    setCurrentIndex(0);
    setPlacedBlocks([]);
    setScore(0);
    setError('');
    setScreen('setup');
  };

  if (screen === 'quiz' && questions.length > 0) {
    return (
      <WordOrderQuizQuestion
        key={currentIndex}
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        placedBlocks={placedBlocks}
        onPlaceBlock={handlePlaceBlock}
        onRemoveBlock={handleRemoveBlock}
        onNext={handleNext}
        onBack={onBack}
      />
    );
  }

  if (screen === 'results') {
    return (
      <WordOrderQuizResults
        score={score}
        total={questions.length}
        onContinue={handleContinue}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div>
      <WordOrderQuizSetup
        selectedGenres={selectedGenres}
        difficulty={difficulty}
        isLoading={isLoading}
        onToggleGenre={toggleGenre}
        onSelectDifficulty={setDifficulty}
        onStart={handleStart}
        onBack={onBack}
      />
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[440px] bg-red-900/80 border border-red-500/50 text-red-200 text-sm rounded-xl px-4 py-3 text-center shadow-xl backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
}
