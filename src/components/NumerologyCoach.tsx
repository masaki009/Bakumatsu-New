import React, { useState, useEffect } from 'react';
import { Calculator, Sparkles, BookOpen, AlertCircle, Quote, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NumerologyAdvice {
  personalDayNumber: number;
  isMasterNumber: boolean;
  keyword: string;
  theme: string;
  tags: string[];
  activities: string[];
  phrase: string;
  phraseTranslation: string;
  caution: string;
  quote: string;
  quoteTranslation: string;
  quoteAuthor: string;
  encouragement: string;
}

interface CalculationDetails {
  birthNumber: number;
  universalDayNumber: number;
  personalDayNumber: number;
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'bg-red-50 border-red-300 text-red-800',
  2: 'bg-orange-50 border-orange-300 text-orange-800',
  3: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  4: 'bg-green-50 border-green-300 text-green-800',
  5: 'bg-teal-50 border-teal-300 text-teal-800',
  6: 'bg-blue-50 border-blue-300 text-blue-800',
  7: 'bg-indigo-50 border-indigo-300 text-indigo-800',
  8: 'bg-purple-50 border-purple-300 text-purple-800',
  9: 'bg-pink-50 border-pink-300 text-pink-800',
  11: 'bg-gradient-to-br from-yellow-100 to-amber-100 border-amber-400 text-amber-900',
  22: 'bg-gradient-to-br from-yellow-100 to-amber-100 border-amber-400 text-amber-900'
};

const ADVICE_DATA: Record<number, Omit<NumerologyAdvice, 'personalDayNumber' | 'isMasterNumber' | 'encouragement'>> = {
  1: {
    keyword: '始まり・リーダーシップ・独立',
    theme: '新しいことを始める日',
    tags: ['スピーキング', '自己表現', '発音'],
    activities: [
      '英語で自己紹介を録音してみる',
      '新しい単語帳を始める',
      'オンライン英会話に挑戦する',
      '英語で目標を声に出して宣言する'
    ],
    phrase: 'I am ready to take the lead.',
    phraseTranslation: '私はリードする準備ができています。',
    caution: '完璧を求めすぎないこと。まずは始めることが大切です。',
    quote: 'The secret of getting ahead is getting started.',
    quoteTranslation: '前進する秘訣は、始めることです。',
    quoteAuthor: 'Mark Twain'
  },
  2: {
    keyword: '調和・協力・バランス',
    theme: '人との交流を大切にする日',
    tags: ['リスニング', '会話', 'ペアワーク'],
    activities: [
      '英語のポッドキャストを聴く',
      '言語交換パートナーと話す',
      '映画のセリフを真似してみる',
      '友人と英語でメッセージ交換をする'
    ],
    phrase: 'Together we can achieve more.',
    phraseTranslation: '一緒なら、もっと多くのことを成し遂げられます。',
    caution: '自分のペースを大切に。他人と比較しすぎないようにしましょう。',
    quote: 'Alone we can do so little; together we can do so much.',
    quoteTranslation: '一人ではほんの少ししかできない。共にならたくさんできる。',
    quoteAuthor: 'Helen Keller'
  },
  3: {
    keyword: '創造性・表現・喜び',
    theme: '楽しく学ぶ日',
    tags: ['ライティング', '創作', '表現'],
    activities: [
      '英語で日記を書く',
      '好きな歌の歌詞を覚える',
      '英語でショートストーリーを書く',
      '絵やイラストに英語のキャプションをつける'
    ],
    phrase: 'Express yourself with joy.',
    phraseTranslation: '喜びをもって自分を表現しましょう。',
    caution: '楽しさを優先して、文法の細かいミスは気にしすぎないこと。',
    quote: 'Creativity is intelligence having fun.',
    quoteTranslation: '創造性とは、知性が楽しんでいる状態です。',
    quoteAuthor: 'Albert Einstein'
  },
  4: {
    keyword: '基礎・構造・着実',
    theme: '基礎を固める日',
    tags: ['文法', 'ノート整理', '反復'],
    activities: [
      '文法書を1章読む',
      '単語カードで復習する',
      'ノートを整理して復習する',
      '基本例文を10回音読する'
    ],
    phrase: 'Build a strong foundation.',
    phraseTranslation: '強固な基礎を築きましょう。',
    caution: '完璧主義になりすぎず、進捗を楽しむことも忘れずに。',
    quote: 'A house is built brick by brick.',
    quoteTranslation: '家は一つ一つのレンガで建てられます。',
    quoteAuthor: 'Proverb'
  },
  5: {
    keyword: '変化・自由・冒険',
    theme: '新しい方法を試す日',
    tags: ['多様な教材', '冒険', '柔軟性'],
    activities: [
      'いつもと違うジャンルの英語記事を読む',
      '新しいアプリを試してみる',
      '英語のゲームやクイズに挑戦',
      '街中の英語表記を写真に撮って調べる'
    ],
    phrase: 'Embrace change and explore.',
    phraseTranslation: '変化を受け入れ、探求しましょう。',
    caution: 'あれこれ手を広げすぎず、1つは最後までやり遂げましょう。',
    quote: 'Life is either a daring adventure or nothing at all.',
    quoteTranslation: '人生は大胆な冒険か、無か、そのどちらかです。',
    quoteAuthor: 'Helen Keller'
  },
  6: {
    keyword: '愛・責任・調和',
    theme: '思いやりと丁寧さを大切にする日',
    tags: ['丁寧な表現', '手紙', '感謝'],
    activities: [
      '感謝の気持ちを英語で書く',
      '丁寧な表現を学ぶ',
      '家族や友人に英語でメッセージを送る',
      '英語の絵本を読む'
    ],
    phrase: 'Learn with love and care.',
    phraseTranslation: '愛と思いやりをもって学びましょう。',
    caution: '自分にも優しく。完璧でなくても大丈夫です。',
    quote: 'Where there is love, there is life.',
    quoteTranslation: '愛があるところに、人生があります。',
    quoteAuthor: 'Mahatma Gandhi'
  },
  7: {
    keyword: '探求・分析・内省',
    theme: '深く理解する日',
    tags: ['読解', '分析', '洞察'],
    activities: [
      '英語の記事を精読する',
      '一つの文法ポイントを徹底的に学ぶ',
      '英語学習の振り返りをする',
      '辞書で語源を調べる'
    ],
    phrase: 'Seek depth and understanding.',
    phraseTranslation: '深さと理解を求めましょう。',
    caution: '考えすぎて行動が止まらないように注意しましょう。',
    quote: 'The unexamined life is not worth living.',
    quoteTranslation: '吟味されない人生は生きる価値がない。',
    quoteAuthor: 'Socrates'
  },
  8: {
    keyword: '達成・力・成功',
    theme: '目標達成に向けて行動する日',
    tags: ['目標設定', '達成', '実践'],
    activities: [
      '具体的な学習目標を設定する',
      '模擬試験に挑戦する',
      '英語でプレゼンの練習をする',
      '学習成果を記録する'
    ],
    phrase: 'Take action towards success.',
    phraseTranslation: '成功に向けて行動しましょう。',
    caution: '結果だけでなく、プロセスも大切にしましょう。',
    quote: 'Success is not final, failure is not fatal.',
    quoteTranslation: '成功は終わりではなく、失敗は致命的ではない。',
    quoteAuthor: 'Winston Churchill'
  },
  9: {
    keyword: '完成・共感・人道',
    theme: '学びを分かち合う日',
    tags: ['復習', 'アウトプット', '共有'],
    activities: [
      '学んだことを誰かに教える',
      '英語学習のブログを書く',
      'これまでのノートを総復習する',
      '英語で社会問題について考える'
    ],
    phrase: 'Share your knowledge with others.',
    phraseTranslation: 'あなたの知識を他の人と分かち合いましょう。',
    caution: '完璧主義にならず、今の自分を受け入れましょう。',
    quote: 'The best way to find yourself is to lose yourself in the service of others.',
    quoteTranslation: '自分を見つける最良の方法は、他者への奉仕に没頭することです。',
    quoteAuthor: 'Mahatma Gandhi'
  },
  11: {
    keyword: '直感・啓示・インスピレーション',
    theme: '直感を信じて学ぶ日',
    tags: ['インスピレーション', '直感', '高次の学び'],
    activities: [
      '心に響く英語のスピーチを聴く',
      '瞑想しながら英語の音を聴く',
      'インスピレーションを英語で書き留める',
      '自分の内なる声に従って学習する'
    ],
    phrase: 'Trust your intuition and inner guidance.',
    phraseTranslation: 'あなたの直感と内なる導きを信じましょう。',
    caution: '地に足をつけることも忘れずに。実践も大切です。',
    quote: 'Intuition is the whisper of the soul.',
    quoteTranslation: '直感は魂のささやきです。',
    quoteAuthor: 'Jiddu Krishnamurti'
  },
  22: {
    keyword: 'マスタービルダー・実現・偉業',
    theme: '大きな目標に向かう日',
    tags: ['長期計画', '実現', '建設'],
    activities: [
      '長期的な英語学習計画を立てる',
      '大きな目標を具体的なステップに分解する',
      '英語で夢や目標を書き出す',
      '自分の可能性を信じて挑戦する'
    ],
    phrase: 'Build your dreams into reality.',
    phraseTranslation: 'あなたの夢を現実に築きましょう。',
    caution: '大きすぎる目標に圧倒されないよう、小さな一歩から始めましょう。',
    quote: 'The future belongs to those who believe in the beauty of their dreams.',
    quoteTranslation: '未来は自分の夢の美しさを信じる人のものです。',
    quoteAuthor: 'Eleanor Roosevelt'
  }
};

const ENCOURAGEMENTS = [
  '今日も一歩ずつ、前進していきましょう！',
  'あなたならできる！応援しています！',
  '素晴らしい一日になりますように！',
  '今日のあなたの学びを楽しんでください！',
  '小さな努力が大きな成果につながります！',
  'あなたの成長を信じています！',
  '今日も素敵な学びの時間を！',
  '一歩一歩、着実に進んでいますね！',
  '今日のあなたは輝いています！',
  '学ぶ喜びを感じてください！'
];

interface NumerologyCoachProps {
  onBack?: () => void;
}

export default function NumerologyCoach({ onBack }: NumerologyCoachProps) {
  const { user } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
  const [advice, setAdvice] = useState<NumerologyAdvice | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cachedAdvice, setCachedAdvice] = useState<{ date: string; advice: NumerologyAdvice; calculation: CalculationDetails } | null>(null);

  useEffect(() => {
    loadSelfProfile();
    loadCachedAdvice();
  }, [user]);

  const loadSelfProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('self_profiles')
      .select('birth')
      .eq('email', user.email)
      .maybeSingle();

    if (data?.birth) {
      setBirthDate(data.birth);
      const saved = localStorage.getItem('numerology_birth_date');
      if (!saved) {
        localStorage.setItem('numerology_birth_date', data.birth);
      }
    } else {
      const saved = localStorage.getItem('numerology_birth_date');
      if (saved) {
        setBirthDate(saved);
      }
    }
  };

  const loadCachedAdvice = () => {
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem(`numerology_advice_${today}`);
    if (cached) {
      setCachedAdvice(JSON.parse(cached));
    }
  };

  const reduceToSingleDigit = (num: number): number => {
    while (num > 9 && num !== 11 && num !== 22) {
      num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  };

  const calculateBirthNumber = (date: string): number => {
    const [year, month, day] = date.split('-').map(Number);
    const sum = month + day;
    return reduceToSingleDigit(sum);
  };

  const calculateUniversalDayNumber = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const sum = year.toString().split('').reduce((s, d) => s + parseInt(d), 0) + month + day;
    return reduceToSingleDigit(sum);
  };

  const handleCalculate = () => {
    if (!birthDate) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (cachedAdvice && cachedAdvice.date === todayStr) {
      setCalculation(cachedAdvice.calculation);
      setAdvice(cachedAdvice.advice);
      setShowResult(true);
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    setLoading(true);
    localStorage.setItem('numerology_birth_date', birthDate);

    const birthNum = calculateBirthNumber(birthDate);
    const universalNum = calculateUniversalDayNumber(today);
    const personalNum = reduceToSingleDigit(birthNum + universalNum);

    const calc: CalculationDetails = {
      birthNumber: birthNum,
      universalDayNumber: universalNum,
      personalDayNumber: personalNum
    };

    const baseAdvice = ADVICE_DATA[personalNum];
    const randomEncouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

    const fullAdvice: NumerologyAdvice = {
      ...baseAdvice,
      personalDayNumber: personalNum,
      isMasterNumber: personalNum === 11 || personalNum === 22,
      encouragement: randomEncouragement
    };

    setCalculation(calc);
    setAdvice(fullAdvice);
    setShowResult(true);

    const cacheData = {
      date: todayStr,
      advice: fullAdvice,
      calculation: calc
    };
    localStorage.setItem(`numerology_advice_${todayStr}`, JSON.stringify(cacheData));
    setCachedAdvice(cacheData);

    setTimeout(() => {
      setLoading(false);
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };


  const handleReset = () => {
    setShowResult(false);
    setCalculation(null);
    setAdvice(null);
    setShowCalculation(false);
  };

  if (showResult && advice && calculation) {
    const numberColor = NUMBER_COLORS[advice.personalDayNumber];
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            戻る
          </button>

          <div className="text-center mb-6">
            <p className="text-lg text-gray-700 font-semibold">{today}</p>
          </div>

          <div id="result-section" className="space-y-6 animate-fadeIn">
            <div className={`bg-white rounded-2xl shadow-lg p-8 border-2 ${numberColor}`}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 text-white mb-4">
                  <div className="text-6xl font-bold">{advice.personalDayNumber}</div>
                </div>
                {advice.isMasterNumber && (
                  <div className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    マスターナンバー
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{advice.keyword}</h2>
                <p className="text-lg text-gray-700 mb-4">{advice.theme}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {advice.tags.map((tag, idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-teal-600 font-semibold">{advice.encouragement}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                <BookOpen className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">今日のおすすめ学習</h3>
                  <ul className="space-y-2">
                    {advice.activities.map((activity, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span className="text-gray-700">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl shadow-md p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">今日のフレーズ練習</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-2 font-serif italic">{advice.phrase}</p>
                  <p className="text-gray-600">{advice.phraseTranslation}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">今日の注意点</h3>
                  <p className="text-gray-700">{advice.caution}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6">
              <div className="flex items-start gap-3">
                <Quote className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">今日のひと言</h3>
                  <p className="text-lg italic text-gray-800 mb-2 font-serif">"{advice.quote}"</p>
                  <p className="text-gray-600 mb-1">{advice.quoteTranslation}</p>
                  <p className="text-sm text-gray-500">— {advice.quoteAuthor}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => setShowCalculation(!showCalculation)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">計算の詳細を見る</span>
                </div>
                {showCalculation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showCalculation && (
                <div className="px-6 pb-6 space-y-3 border-t">
                  <div className="pt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">誕生数</p>
                      <p className="text-3xl font-bold text-purple-600">{calculation.birthNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ユニバーサル・デイ</p>
                      <p className="text-3xl font-bold text-teal-600">{calculation.universalDayNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">パーソナル・デイ</p>
                      <p className="text-3xl font-bold text-indigo-600">{calculation.personalDayNumber}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-4">
                    {calculation.birthNumber} + {calculation.universalDayNumber} = {calculation.personalDayNumber}
                  </p>
                </div>
              )}
            </div>

          </div>

          <div className="mt-12 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">今日の数字早見表</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22].map((num) => {
                const data = ADVICE_DATA[num];
                const isActive = num === advice.personalDayNumber;
                return (
                  <div
                    key={num}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-purple-500 to-teal-500 text-white shadow-lg scale-105'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-800'}`}>{num}</div>
                    <div className={`text-xs mt-1 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {data.keyword.split('・')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-teal-100">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            戻る
          </button>
        )}

        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">数秘術英語チューター</h1>
          <p className="text-xl text-gray-600">生年月日から導く、あなただけの英語学習アドバイス</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                あなたの生年月日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
              {!birthDate && (
                <p className="mt-2 text-sm text-gray-500">
                  生年月日を入力してください
                </p>
              )}
            </div>

            <button
              onClick={handleCalculate}
              disabled={!birthDate || loading}
              className="w-full bg-gradient-to-r from-purple-500 to-teal-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  計算中...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  今日のアドバイスを見る
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>生年月日は安全にローカルストレージに保存されます。</p>
          <p className="mt-1">同じ日に再度アクセスした場合、保存された結果を表示します。</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
