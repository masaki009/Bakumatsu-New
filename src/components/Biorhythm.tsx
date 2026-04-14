import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { supabase } from '../lib/supabase';

type BiorhythmProps = {
  onBack: () => void;
};

type BiorhythmData = {
  physical: number;
  emotional: number;
  intellectual: number;
};

type Recommendation = {
  cycle: string;
  icon: string;
  title: string;
  description: string;
  arrow: string;
  duration: string;
  activities: string[];
  examples: string[];
  tips: string;
};

export default function Biorhythm({ onBack }: BiorhythmProps) {
  const { user } = useAuth();
  useVitalSync({ userId: user?.id });
  const [birthDate, setBirthDate] = useState<string>('');
  const [savedBirthDate, setSavedBirthDate] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [biorhythm, setBiorhythm] = useState<BiorhythmData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chartData, setChartData] = useState<{ day: number; physical: number; emotional: number; intellectual: number }[]>([]);

  useEffect(() => {
    loadBirthDate();
  }, [user]);

  const loadBirthDate = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('self_profiles')
      .select('birth')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data?.birth) {
      const formattedDate = data.birth;
      setSavedBirthDate(formattedDate);
      setBirthDate(formattedDate);
    }
  };

  const calculateBiorhythm = (birthDate: Date, targetDate: Date): BiorhythmData => {
    const daysSinceBirth = Math.floor((targetDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

    const physical = Math.sin((2 * Math.PI * daysSinceBirth) / 23);
    const emotional = Math.sin((2 * Math.PI * daysSinceBirth) / 28);
    const intellectual = Math.sin((2 * Math.PI * daysSinceBirth) / 33);

    return {
      physical: Math.round(physical * 100) / 100,
      emotional: Math.round(emotional * 100) / 100,
      intellectual: Math.round(intellectual * 100) / 100,
    };
  };

  const generateChartData = (birthDate: Date, targetDate: Date) => {
    const data = [];
    for (let i = -14; i <= 14; i++) {
      const date = new Date(targetDate);
      date.setDate(date.getDate() + i);
      const rhythm = calculateBiorhythm(birthDate, date);
      data.push({
        day: i,
        physical: rhythm.physical,
        emotional: rhythm.emotional,
        intellectual: rhythm.intellectual,
      });
    }
    return data;
  };

  const getRecommendations = (biorhythm: BiorhythmData): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    if (biorhythm.physical > 0.5) {
      recommendations.push({
        cycle: '身体リズム',
        icon: '🎤',
        title: 'シャドーイング＆音読トレーニング',
        description: '身体エネルギーが高い今日は、声を使った積極的な練習が最適です。口の筋肉をフルに使って英語の音を体で覚えましょう。',
        arrow: '↑',
        duration: '20-30分',
        activities: [
          'TED Talksやポッドキャストを選び、1-2分のセグメントを抜粋',
          '最初は普通の速度で聞き、内容を理解する',
          '0.75倍速でシャドーイング（音声の直後に続けて発音）',
          '通常速度でシャドーイング、発音とイントネーションを意識',
          '1.25倍速にチャレンジして口の反応速度を鍛える',
          '最後に自分の声を録音して、元の音声と比較'
        ],
        examples: [
          '「How Tech Companies Deceive You」（TED: 6分）',
          '「BBC 6 Minute English」シリーズ',
          '「All Ears English」ポッドキャスト'
        ],
        tips: '立って練習すると、より呼吸がしやすく、発音が明瞭になります。鏡の前で口の形を確認するのも効果的です。'
      });
    } else if (biorhythm.physical < -0.5) {
      recommendations.push({
        cycle: '身体リズム',
        icon: '🎧',
        title: 'リスニング＆ノートテイキング',
        description: '身体エネルギーが低い日は、座って静かに集中できるインプット学習が向いています。耳と手を使った学習で無理なく続けられます。',
        arrow: '↓',
        duration: '15-25分',
        activities: [
          '興味のあるトピックの英語動画やポッドキャストを選ぶ',
          '最初は字幕なしで全体を聞き、大まかな内容を把握',
          '2回目は英語字幕ありで聞き、知らない表現をメモ',
          'メモした表現を辞書で調べ、例文と一緒に記録',
          '特に気になったフレーズを5つ選び、ノートに書き写す',
          '翌日以降、そのフレーズを使った短い文を作る'
        ],
        examples: [
          '「The Daily」（NYタイムズのニュースポッドキャスト）',
          '「Crash Course」（教育系YouTube）',
          '「Stuff You Should Know」（雑学ポッドキャスト）'
        ],
        tips: 'お気に入りの飲み物を用意して、リラックスした環境で学習しましょう。無理に全部理解しようとせず、楽しむことが大切です。'
      });
    }

    if (biorhythm.emotional > 0.5) {
      recommendations.push({
        cycle: '感情リズム',
        icon: '🎬',
        title: 'ストーリーテリング＆感情表現',
        description: '感情が豊かな今日は、物語や感情を伝える表現が自然に身につきます。映画やドラマの台詞を通じて、生きた英語を学びましょう。',
        arrow: '↑',
        duration: '30-45分',
        activities: [
          '好きな映画・ドラマのワンシーン（3-5分）を選ぶ',
          '英語音声＋英語字幕で視聴し、感情の込め方に注目',
          '印象的な台詞を3-5個ピックアップして書き出す',
          '登場人物になりきって、同じ感情で台詞を音読',
          'シーンを見ずに、台詞だけで感情を表現する練習',
          '自分の経験に置き換えて、似た状況の英語日記を書く'
        ],
        examples: [
          '「Friends」（日常会話の宝庫）',
          '「The Pursuit of Happyness」（感動的なスピーチ）',
          '「Ted Lasso」（ポジティブな表現）',
          '「This Is Us」（家族の感情表現）'
        ],
        tips: '感情を込めて演じることで、単なる暗記ではなく「体験」として英語が記憶に残ります。恥ずかしがらずに感情を全開にしましょう！'
      });
    } else if (biorhythm.emotional < -0.5) {
      recommendations.push({
        cycle: '感情リズム',
        icon: '🃏',
        title: '単語カード＆反復学習',
        description: '感情が落ち着いている日は、機械的な反復学習が効果的です。淡々と続けることで、着実に語彙力を積み上げられます。',
        arrow: '↓',
        duration: '15-20分',
        activities: [
          '今週学んだ新出単語・フレーズをカードに書き出す（10-15個）',
          '表に英語、裏に日本語と例文を記入',
          'カードをシャッフルして、ランダムに学習',
          '即答できたカードは「完璧」、迷ったカードは「要復習」に分類',
          '「要復習」カードを5回繰り返す',
          '最後に全カードを通して、定着度を確認'
        ],
        examples: [
          'Quizlet（無料の単語カードアプリ）',
          'Anki（間隔反復学習アプリ）',
          '紙のカード（手書きが記憶に効果的）'
        ],
        tips: '1日10分でも毎日続けることが重要です。感情を使わない分、疲れにくいので継続しやすい学習法です。'
      });
    }

    if (biorhythm.intellectual > 0.5) {
      recommendations.push({
        cycle: '知性リズム',
        icon: '✍️',
        title: '文法分析＆ライティング',
        description: '知性が冴えている今日は、複雑な文法構造の理解や論理的な文章作成に挑戦しましょう。頭を使う学習が楽しく感じられる日です。',
        arrow: '↑',
        duration: '25-40分',
        activities: [
          '興味のあるトピックで短いエッセイ記事を読む（300-500語）',
          '複雑な文構造（関係代名詞、仮定法など）を3つ見つける',
          'それらの文法構造を分析し、なぜその形なのか理解する',
          '同じ文法構造を使って、自分の意見を3文書く',
          'さらに発展させて、100-150語の短いエッセイを執筆',
          'Grammarly等のツールで文法チェックし、間違いから学ぶ'
        ],
        examples: [
          '「The Atlantic」「The Guardian」の Opinion 記事',
          '「Medium」の英語記事',
          'IELTS/TOEFL のサンプルエッセイ',
          '「Write & Improve」（Cambridge の無料ライティング添削）'
        ],
        tips: '完璧を目指さず、まずは書き始めることが大切。間違いは学習のチャンスです。辞書や翻訳ツールも活用しましょう。'
      });
    } else if (biorhythm.intellectual < -0.5) {
      recommendations.push({
        cycle: '知性リズム',
        icon: '💬',
        title: 'チャンク暗記＆パターン練習',
        description: '知性が低調な日は、深く考えずに体で覚える学習が効果的です。よく使うフレーズをそのまま覚えて、会話の引き出しを増やしましょう。',
        arrow: '↓',
        duration: '15-25分',
        activities: [
          '日常会話でよく使うチャンク（定型表現）を5つ選ぶ',
          '各チャンクを10回声に出して読む（リズムを意識）',
          'それぞれのチャンクを使った簡単な会話例を作る',
          '一人二役で会話練習（質問→チャンクで返答）',
          'スマホで自分の会話を録音して聞き返す',
          '翌日、覚えたチャンクを実際に使う機会を探す'
        ],
        examples: [
          '「That makes sense.」（納得したとき）',
          '「I was wondering if...」（丁寧な依頼）',
          '「To be honest...」（正直に言うと）',
          '「I couldn\'t agree more.」（完全に同意）',
          '「It depends on...」（場合による）',
          '「Now that you mention it...」（言われてみれば）'
        ],
        tips: 'チャンクは文法を分析せず、音の塊として覚えましょう。歌のフレーズを覚えるように、リズムで体に染み込ませるのがコツです。'
      });
    }

    return recommendations;
  };

  const handleShowResults = () => {
    if (!birthDate) return;

    const birth = new Date(birthDate);
    const today = new Date();
    const rhythm = calculateBiorhythm(birth, today);
    const chart = generateChartData(birth, today);
    const recs = getRecommendations(rhythm);

    setBiorhythm(rhythm);
    setChartData(chart);
    setRecommendations(recs);
    setShowResults(true);
  };

  const getStatusText = (value: number): string => {
    if (value > 0.5) return '高';
    if (value < -0.5) return '低';
    return '中';
  };

  const getStatusColor = (value: number): string => {
    if (value > 0.5) return 'text-blue-600';
    if (value < -0.5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBarColor = (type: 'physical' | 'emotional' | 'intellectual'): string => {
    if (type === 'physical') return 'bg-teal-500';
    if (type === 'emotional') return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">バイオリズム</h1>
              <p className="text-sm text-gray-600">あなたのリズムに合わせた学習メニューを提案します</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <p className="text-gray-700 mb-6">
                生年月日を入力すると、今日のリズムに合わせた学習メニューを提案します
              </p>

              {!savedBirthDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    頻繁に利用するにはプロフィールのセルフ設定で生年月日を登録してください
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生年月日
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleShowResults}
                disabled={!birthDate}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Calendar size={20} />
                今日の提案を見る
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                本日（{formatDate(new Date())}）の状態
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-teal-50 rounded-lg p-6">
                  <div className="text-sm font-medium text-gray-600 mb-2">身体</div>
                  <div className={`text-3xl font-bold mb-3 ${getStatusColor(biorhythm!.physical)}`}>
                    {getStatusText(biorhythm!.physical)} {biorhythm!.physical > 0 ? '+' : ''}{biorhythm!.physical.toFixed(2)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getBarColor('physical')}`}
                      style={{ width: `${((biorhythm!.physical + 1) / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="text-sm font-medium text-gray-600 mb-2">感情</div>
                  <div className={`text-3xl font-bold mb-3 ${getStatusColor(biorhythm!.emotional)}`}>
                    {getStatusText(biorhythm!.emotional)} {biorhythm!.emotional > 0 ? '+' : ''}{biorhythm!.emotional.toFixed(2)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getBarColor('emotional')}`}
                      style={{ width: `${((biorhythm!.emotional + 1) / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="text-sm font-medium text-gray-600 mb-2">知性</div>
                  <div className={`text-3xl font-bold mb-3 ${getStatusColor(biorhythm!.intellectual)}`}>
                    {getStatusText(biorhythm!.intellectual)} {biorhythm!.intellectual > 0 ? '+' : ''}{biorhythm!.intellectual.toFixed(2)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getBarColor('intellectual')}`}
                      style={{ width: `${((biorhythm!.intellectual + 1) / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-teal-500 rounded"></div>
                    <span className="text-sm text-gray-600">身体</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">感情</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm text-gray-600">知性</span>
                  </div>
                </div>

                <div className="relative h-64 border border-gray-200 rounded-lg p-4">
                  <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="400" y1="0" x2="400" y2="200" stroke="#9ca3af" strokeWidth="2" />

                    <polyline
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="3"
                      points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 800},${100 - d.physical * 90}`).join(' ')}
                    />
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 800},${100 - d.emotional * 90}`).join(' ')}
                    />
                    <polyline
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="3"
                      points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 800},${100 - d.intellectual * 90}`).join(' ')}
                    />

                    <circle cx="400" cy={100 - biorhythm!.physical * 90} r="6" fill="#14b8a6" />
                    <circle cx="400" cy={100 - biorhythm!.emotional * 90} r="6" fill="#3b82f6" />
                    <circle cx="400" cy={100 - biorhythm!.intellectual * 90} r="6" fill="#f97316" />

                    <text x="20" y="20" fontSize="12" fill="#6b7280">1.0</text>
                    <text x="20" y="105" fontSize="12" fill="#6b7280">0.0</text>
                    <text x="20" y="190" fontSize="12" fill="#6b7280">-1.0</text>
                    <text x="30" y="220" fontSize="12" fill="#6b7280">-14</text>
                    <text x="380" y="220" fontSize="12" fill="#6b7280">+1</text>
                    <text x="750" y="220" fontSize="12" fill="#6b7280">+14</text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">今日のおすすめ学習メニュー</h2>

              <div className="space-y-6">
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-6">
                      <div className="text-6xl flex-shrink-0">{rec.icon}</div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {rec.cycle} {rec.arrow}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              目安時間: {rec.duration}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">{rec.title}</h3>
                          <p className="text-gray-700 leading-relaxed text-lg">{rec.description}</p>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            学習ステップ
                          </h4>
                          <ol className="space-y-2">
                            {rec.activities.map((activity, actIndex) => (
                              <li key={actIndex} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {actIndex + 1}
                                </span>
                                <span className="text-gray-700 leading-relaxed">{activity}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                          <h4 className="font-bold text-gray-900 mb-3">おすすめ教材</h4>
                          <ul className="space-y-2">
                            {rec.examples.map((example, exIndex) => (
                              <li key={exIndex} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">▸</span>
                                <span className="text-gray-700">{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">💡</span>
                            <div>
                              <h4 className="font-bold text-gray-900 mb-1">学習のコツ</h4>
                              <p className="text-gray-700 leading-relaxed">{rec.tips}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">継続のポイント</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>完璧を目指さず、毎日少しずつ続けることが最も重要です</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>体調や気分に合わせて学習方法を変えることで、無理なく継続できます</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>学習記録をつけると、自分の成長が見えてモチベーションが上がります</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
