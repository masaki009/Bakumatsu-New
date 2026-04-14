import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { supabase } from '../lib/supabase';
import { getJSTDate } from '../utils/dateUtils';
import { ArrowLeft, MessageSquare, Loader2, Sparkles, Target, TrendingUp, Calendar, BookOpen, Lightbulb, BarChart3, RefreshCw } from 'lucide-react';

type AICoachFeedbackProps = {
  onBack: () => void;
};

type LearningInsight = {
  insightid: string;
  email: string;
  diarydate: string;
  sentimentscore: number | null;
  topictag: string | null;
  topicrepeatcount: number;
  readinggapscore: number;
  readingcumulative: number;
  readingpacestatus: string | null;
  advicetext: string | null;
  advicetype: string | null;
  userread: boolean;
  created_at: string;
  updated_at: string;
  consistencyscore?: number;
};

type SelfProfile = {
  current_level: string;
  target: string;
  by_when: string;
  study_type: string;
  total_train_number: number;
  total_reading_number: number;
};

type CoachProfile = {
  character: string;
  target: string;
  speaking: string;
};

type DiaryEntry = {
  date: string;
  s_reading: number;
  o_speaking: number;
  listening: number;
  words: number;
  ex_reading: number;
  time: number;
  self_judge: number;
  self_topic: string;
  one_word: string;
};

export default function AICoachFeedback({ onBack }: AICoachFeedbackProps) {
  const { userProfile } = useAuth();
  useVitalSync({ userId: userProfile?.id });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<LearningInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentDiaries, setRecentDiaries] = useState<DiaryEntry[]>([]);
  const [selfProfile, setSelfProfile] = useState<SelfProfile | null>(null);
  const [isNewlyGenerated, setIsNewlyGenerated] = useState(false);

  useEffect(() => {
    loadTodaysFeedback();
  }, []);

  useEffect(() => {
    if (isNewlyGenerated) {
      const timer = setTimeout(() => {
        setIsNewlyGenerated(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNewlyGenerated]);

  const getJSTDate = (): string => {
    const now = new Date();
    const jstOffset = 9 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jstDate = new Date(utc + (jstOffset * 60000));
    return jstDate.toISOString().split('T')[0];
  };

  const handleRegenerateFeedback = async () => {
    try {
      setError(null);
      const today = getJSTDate();

      await supabase
        .from('learning_insight')
        .delete()
        .eq('user_id', userProfile?.id)
        .eq('diarydate', today);

      setFeedback(null);
      await generateFeedback(today);
      setIsNewlyGenerated(true);
    } catch (err) {
      console.error('Error regenerating feedback:', err);
      setError('フィードバックの再生成に失敗しました');
    }
  };

  const loadTodaysFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = getJSTDate();

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const [feedbackResult, selfProfileResult, diariesResult] = await Promise.all([
        supabase
          .from('learning_insight')
          .select('*')
          .eq('user_id', userProfile?.id)
          .eq('diarydate', today)
          .maybeSingle(),
        supabase
          .from('self_profiles')
          .select('current_level, target, by_when, study_type, total_train_number, total_reading_number')
          .eq('user_id', userProfile?.id)
          .maybeSingle(),
        supabase
          .from('s_diaries')
          .select('date, s_reading, o_speaking, listening, words, ex_reading, time, self_judge, self_topic, one_word')
          .eq('user_id', userProfile?.id)
          .gte('date', sevenDaysAgoStr)
          .lte('date', today)
          .order('date', { ascending: false })
      ]);

      if (feedbackResult.error) throw feedbackResult.error;

      setSelfProfile(selfProfileResult.data);
      setRecentDiaries(diariesResult.data || []);

      if (feedbackResult.data) {
        setFeedback(feedbackResult.data);
        if (!feedbackResult.data.userread) {
          await supabase
            .from('learning_insight')
            .update({ userread: true })
            .eq('user_id', userProfile?.id)
            .eq('diarydate', today);
        }
      } else {
        await generateFeedback(today);
      }
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('フィードバックの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async (today: string) => {
    try {
      setGenerating(true);

      const { data: coachProfile, error: coachError } = await supabase
        .from('coach_profiles')
        .select('character, target, speaking')
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      if (coachError) {
        console.error('コーチプロフィール取得エラー:', coachError);
        setError('データベースエラーが発生しました。しばらく待ってから再度お試しください。');
        setGenerating(false);
        return;
      }

      if (!coachProfile) {
        setError('まず最初に「プロフィール設定」→「チューター設定」からAIチューターを登録してください。');
        setGenerating(false);
        return;
      }

      const { data: selfProfileData } = await supabase
        .from('self_profiles')
        .select('current_level, target, by_when, study_type, total_train_number, total_reading_number')
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      setSelfProfile(selfProfileData);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: recentDiariesData } = await supabase
        .from('s_diaries')
        .select('date, s_reading, o_speaking, listening, words, ex_reading, time, self_judge, self_topic, one_word')
        .eq('user_id', userProfile?.id)
        .gte('date', sevenDaysAgoStr)
        .lte('date', today)
        .order('date', { ascending: false });

      setRecentDiaries(recentDiariesData || []);

      const todayDiary = recentDiariesData?.find(d => d.date === today);

      const aiAdvice = await generateAIAdvice(selfProfileData, coachProfile, recentDiariesData || []);

      const sentimentScore = analyzeSentiment(todayDiary?.one_word || '', todayDiary?.self_topic || '');
      const topicTag = extractTopicTag(todayDiary?.self_topic || '');
      const topicRepeatCount = calculateTopicRepeatCount(recentDiariesData || [], topicTag);

      const readingGapScore = (todayDiary?.ex_reading || 0) - Math.floor((selfProfileData?.total_reading_number || 0) / 365);

      const { data: vitalData } = await supabase
        .from('vital')
        .select('readbooks')
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      const readingCumulative = vitalData?.readbooks || 0;

      let readingPaceStatus: 'ahead' | 'on_track' | 'behind' = 'on_track';
      if (readingGapScore > 5) readingPaceStatus = 'ahead';
      else if (readingGapScore < -5) readingPaceStatus = 'behind';

      const consistencyScore = calculateConsistencyScore(recentDiariesData || []);

      const newInsight = {
        user_id: userProfile?.id,
        email: userProfile?.email,
        diarydate: today,
        sentimentscore: sentimentScore,
        topictag: topicTag,
        topicrepeatcount: topicRepeatCount,
        readinggapscore: readingGapScore,
        readingcumulative: readingCumulative,
        readingpacestatus: readingPaceStatus,
        advicetext: aiAdvice.text,
        advicetype: aiAdvice.type,
        userread: true,
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('learning_insight')
        .upsert([newInsight], {
          onConflict: 'user_id,diarydate',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('データベース挿入エラー:', insertError);
        console.error('エラー詳細:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        console.error('挿入しようとしたデータ:', newInsight);

        if (insertError.code === '23502') {
          throw new Error('必須項目が不足しています (NOT NULL制約違反)');
        } else if (insertError.code === '23514') {
          throw new Error('データの値が制約条件を満たしていません (CHECK制約違反)');
        } else if (insertError.message.includes('column')) {
          throw new Error(`カラム名の不一致またはデータ型の問題: ${insertError.message}`);
        } else {
          throw insertError;
        }
      }

      const enrichedData = { ...insertedData, consistencyscore: consistencyScore };
      setFeedback(enrichedData);
      setIsNewlyGenerated(true);
    } catch (err) {
      console.error('Error generating feedback:', err);
      if (err instanceof Error) {
        if (err.message.includes('unique') || err.message.includes('constraint')) {
          setError('データベースの制約エラーが発生しました。ページを再読み込みしてください。');
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
        } else {
          setError(err.message);
        }
      } else {
        setError('予期しないエラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setGenerating(false);
    }
  };

  const calculateConsistencyScore = (diaryEntries: DiaryEntry[]): number => {
    if (diaryEntries.length === 0) return 0;
    if (diaryEntries.length === 1) return 1;

    const last7Days = 7;
    const studyDays = diaryEntries.filter(d => (d.time || 0) > 0).length;
    const consistencyRatio = studyDays / Math.min(last7Days, diaryEntries.length);

    if (consistencyRatio >= 0.85) return 3;
    if (consistencyRatio >= 0.6) return 2;
    if (consistencyRatio >= 0.3) return 1;
    return 0;
  };

  const generateAIAdvice = async (
    selfProfile: SelfProfile | null,
    coachProfile: CoachProfile | null,
    recentDiaries: DiaryEntry[]
  ): Promise<{ text: string; type: string }> => {
    const todayStr = getJSTDate();
    const todayDiary = recentDiaries.find(d => d.date === todayStr);
    try {
      const totalStudyTime = recentDiaries.reduce((sum, entry) => sum + (entry.time || 0), 0);
      const avgStudyTime = recentDiaries.length > 0 ? totalStudyTime / recentDiaries.length : 0;

      const targetDate = selfProfile?.by_when ? new Date(selfProfile.by_when) : null;
      const now = new Date();
      let daysRemaining = 0;
      if (targetDate) {
        daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      const recentAvgJudge = recentDiaries.length > 0
        ? recentDiaries.reduce((sum, entry) => sum + (entry.self_judge || 0), 0) / recentDiaries.length
        : 0;

      const trend = recentDiaries.length >= 3 ? recentDiaries.slice(0, 3).map(d => d.self_judge || 0) : [];
      const isImproving = trend.length === 3 && trend[0] > trend[1] && trend[1] > trend[2];
      const isDeclining = trend.length === 3 && trend[0] < trend[1] && trend[1] < trend[2];

      let contextPrompt = `あなたは英語学習専属AIチューターです。以下の学習者の情報に基づいて、本日のパーソナライズされたフィードバックを生成してください。\n\n`;

      if (selfProfile) {
        contextPrompt += `## 学習者プロフィール\n`;
        contextPrompt += `- 現在のレベル: ${selfProfile.current_level || '未設定'}\n`;
        contextPrompt += `- 目標: ${selfProfile.target || '未設定'}\n`;
        if (selfProfile.by_when) {
          contextPrompt += `- 目標達成期限: ${selfProfile.by_when} (残り${daysRemaining}日)\n`;
        }
        contextPrompt += `- 学習スタイル: ${selfProfile.study_type || '未設定'}\n`;
        contextPrompt += `- 累計目標学習時間: ${selfProfile.total_train_number || 0}分\n`;
        contextPrompt += `- 累計目標多読語数: ${selfProfile.total_reading_number || 0}語\n\n`;
      }

      if (coachProfile) {
        contextPrompt += `## チューター設定\n`;
        contextPrompt += `- キャラクター性: ${coachProfile.character}\n`;
        contextPrompt += `- 指導方針: ${coachProfile.target}\n`;
        contextPrompt += `- 話し方: ${coachProfile.speaking}\n\n`;
      }

      contextPrompt += `## 直近7日間の学習データ\n`;
      if (recentDiaries.length > 0) {
        contextPrompt += `- 学習記録数: ${recentDiaries.length}日分\n`;
        contextPrompt += `- 平均学習時間: ${avgStudyTime.toFixed(0)}分/日\n`;
        contextPrompt += `- 平均自己評価: ${recentAvgJudge.toFixed(1)}点\n`;

        if (trend.length === 3) {
          contextPrompt += `- 自己評価の推移: ${trend[2]}→${trend[1]}→${trend[0]}点\n`;
          if (isImproving) {
            contextPrompt += `- 傾向: 上昇傾向（成長中）\n`;
          } else if (isDeclining) {
            contextPrompt += `- 傾向: 下降傾向（注意が必要）\n`;
          } else {
            contextPrompt += `- 傾向: 安定\n`;
          }
        }

        if (todayDiary) {
          contextPrompt += `\n### 本日の学習記録\n`;
          contextPrompt += `- 学習時間: ${todayDiary.time || 0}分\n`;
          contextPrompt += `- 自己評価: ${todayDiary.self_judge || 0}点\n`;
          contextPrompt += `- 一言メモ: ${todayDiary.one_word || 'なし'}\n`;
          contextPrompt += `- 学習トピック: ${todayDiary.self_topic || 'なし'}\n`;
          if (todayDiary.ex_reading > 0) {
            contextPrompt += `- 多読語数: ${todayDiary.ex_reading}語\n`;
          }
        }
      } else {
        contextPrompt += `- まだ学習記録がありません\n`;
      }

      contextPrompt += `\n## フィードバック生成の指示\n`;
      contextPrompt += `上記の情報を踏まえて、以下の内容を含む200〜400文字程度の励ましのメッセージを生成してください：\n`;
      contextPrompt += `1. 目標達成への道のり（目標と現状のギャップ、残り日数を考慮）\n`;
      contextPrompt += `2. 最近の学習状況の評価（学習時間、自己評価の推移など）\n`;
      contextPrompt += `3. 具体的なアドバイスや励まし\n\n`;

      if (coachProfile?.speaking) {
        contextPrompt += `必ず「${coachProfile.speaking}」の話し方スタイルで書いてください。\n`;
      }

      contextPrompt += `フィードバックは前向きで、学習者のモチベーションを高める内容にしてください。`;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consultation-ai`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: contextPrompt
            }
          ],
          type: 'general',
          userId: userProfile?.id,
          coachProfile: coachProfile ? {
            type: coachProfile.character,
            character: coachProfile.character,
            target: coachProfile.target,
            speaking: coachProfile.speaking
          } : undefined,
          selfProfile: selfProfile ? {
            name: userProfile?.email || '',
            current_level: selfProfile.current_level,
            target: selfProfile.target,
            by_when: selfProfile.by_when,
            study_type: selfProfile.study_type
          } : undefined
        })
      });

      if (!response.ok) {
        throw new Error('AI APIの呼び出しに失敗しました');
      }

      const data = await response.json();
      const aiAdviceText = data.message;

      let adviceType = '激励';
      if (isImproving) {
        adviceType = '激励';
      } else if (isDeclining) {
        adviceType = '軌道修正';
      } else if (recentAvgJudge >= 4) {
        adviceType = '祝辞';
      }

      return { text: aiAdviceText, type: adviceType };
    } catch (error) {
      console.error('AI生成エラー、フォールバックを使用:', error);

      return generateFallbackAdvice(selfProfile, recentDiaries);
    }
  };

  const generateFallbackAdvice = (
    selfProfile: SelfProfile | null,
    recentDiaries: DiaryEntry[]
  ): { text: string; type: string } => {
    let adviceType = '激励';
    let goalSection = '';
    let recentLearningSection = '';

    const totalStudyTime = recentDiaries.reduce((sum, entry) => sum + (entry.time || 0), 0);
    const avgStudyTime = recentDiaries.length > 0 ? totalStudyTime / recentDiaries.length : 0;

    const targetDate = selfProfile?.by_when ? new Date(selfProfile.by_when) : null;
    const now = new Date();
    let daysRemaining = 0;
    if (targetDate) {
      daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const recentAvgJudge = recentDiaries.length > 0
      ? recentDiaries.reduce((sum, entry) => sum + (entry.self_judge || 0), 0) / recentDiaries.length
      : 0;

    if (daysRemaining > 0 && selfProfile?.target) {
      const currentLevel = selfProfile.current_level || '現在のレベル';
      const target = selfProfile.target;
      const dailyGoal = Math.ceil((selfProfile.total_train_number || 0) / Math.max(daysRemaining, 1));

      goalSection = `【目標到達までの道のり】\n目標「${target}」まで残り${daysRemaining}日です。現在「${currentLevel}」から目標達成するには、1日あたり約${dailyGoal}分の学習時間が必要となります。このペースを維持できれば、計画通りに目標レベルに到達できるでしょう。焦らず着実に積み重ねることが成功への鍵です。`;
    } else if (selfProfile?.target) {
      goalSection = `【目標到達までの道のり】\n目標は「${selfProfile.target}」です。期限を設定すると、より具体的な学習計画が立てられます。計画的な学習で着実に前進しましょう。毎日少しずつでも継続することで、確実に目標に近づいていけます。`;
    } else {
      goalSection = `【目標到達までの道のり】\n具体的な目標を設定すると、より効果的な学習計画が立てられます。目標があることで、日々の学習にも明確な方向性が生まれ、モチベーションの維持にもつながります。`;
    }

    if (recentDiaries.length >= 3) {
      const trend = recentDiaries.slice(0, 3).map(d => d.self_judge || 0);
      const isImproving = trend[0] > trend[1] && trend[1] > trend[2];
      const isDeclining = trend[0] < trend[1] && trend[1] < trend[2];

      const weeklyAvg = avgStudyTime.toFixed(0);

      if (isImproving) {
        recentLearningSection = `【最近の学習について】\n直近7日間の平均学習時間は${weeklyAvg}分です。自己評価も上昇傾向（${trend[2]}→${trend[1]}→${trend[0]}点）にあり、学習効果がしっかりと出ている証拠です。学習方法が自分に合っている可能性が高いので、この調子で継続していきましょう。成長を実感できる瞬間を大切にしてください。`;
        adviceType = '激励';
      } else if (isDeclining) {
        recentLearningSection = `【最近の学習について】\n直近7日間の平均学習時間は${weeklyAvg}分です。自己評価が下降傾向（${trend[2]}→${trend[1]}→${trend[0]}点）にあります。疲れが溜まっているかもしれません。一度学習方法を見直すか、適度な休息を取ることをお勧めします。焦らず自分のペースを取り戻しましょう。`;
        adviceType = '軌道修正';
      } else {
        recentLearningSection = `【最近の学習について】\n直近7日間の平均学習時間は${weeklyAvg}分、平均自己評価は${recentAvgJudge.toFixed(1)}点です。安定したペースで学習を続けられています。この安定感は非常に重要です。継続は力なり、着実に実力が積み上がっています。`;
      }
    } else if (recentDiaries.length > 0) {
      recentLearningSection = `【最近の学習について】\n学習を開始されたばかりですね。最初の一歩を踏み出したことは素晴らしいです。まずは継続することを第一目標として、無理のないペースで進めていきましょう。習慣化することで、学習が日常の一部になります。`;
    } else {
      recentLearningSection = `【最近の学習について】\n学習記録がまだありません。今日から記録を始めて、学習習慣を作っていきましょう。最初は小さな一歩からで構いません。記録を残すことで、自分の成長を可視化でき、モチベーション維持にも役立ちます。`;
    }

    const adviceText = `${goalSection}\n\n${recentLearningSection}`;

    return { text: adviceText, type: adviceType };
  };

  const analyzeSentiment = (oneWord: string, selfTopic: string): number => {
    const positiveWords = ['楽しい', '嬉しい', '良い', '素晴らしい', '成長', '達成', 'できた', '頑張'];
    const negativeWords = ['難しい', '苦手', '大変', '辛い', '厳しい', 'できない', '失敗'];

    const text = (oneWord + ' ' + selfTopic).toLowerCase();

    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) return 1;
    if (negativeCount > positiveCount) return -1;
    return 0;
  };

  const extractTopicTag = (selfTopic: string): string | null => {
    const topics = {
      '文法': ['文法', 'grammar', '構文'],
      '発音': ['発音', 'pronunciation', '音'],
      '語彙': ['語彙', 'vocabulary', '単語', 'ボキャブラ'],
      'リスニング': ['リスニング', 'listening', '聞き取り'],
      'スピーキング': ['スピーキング', 'speaking', '会話'],
      'リーディング': ['リーディング', 'reading', '読解'],
      'ライティング': ['ライティング', 'writing', '作文'],
    };

    const text = selfTopic.toLowerCase();

    for (const [tag, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return tag;
      }
    }

    return null;
  };

  const calculateTopicRepeatCount = (diaryEntries: DiaryEntry[], currentTag: string | null): number => {
    if (!currentTag) return 0;

    let count = 0;
    for (const entry of diaryEntries) {
      const tag = extractTopicTag(entry.self_topic || '');
      if (tag === currentTag) {
        count++;
      } else {
        break;
      }
    }

    return count;
  };

  const getConsistencyIcon = (score: number | undefined) => {
    switch (score) {
      case 3:
        return '😄';
      case 2:
        return '🙂';
      case 1:
        return '😐';
      default:
        return '😔';
    }
  };

  const getConsistencyLabel = (score: number | undefined) => {
    switch (score) {
      case 3:
        return '非常に良好';
      case 2:
        return '良好';
      case 1:
        return 'やや不足';
      default:
        return '要改善';
    }
  };

  const generateTodaysSuggestions = () => {
    if (!selfProfile || recentDiaries.length === 0) {
      return (
        <div className="text-gray-600">
          <p>学習記録がまだありません。今日から記録を始めましょう！</p>
        </div>
      );
    }

    const today = getJSTDate();
    const todayDiary = recentDiaries.find(d => d.date === today);
    const avgStudyTime = recentDiaries.reduce((sum, d) => sum + (d.time || 0), 0) / recentDiaries.length;
    const avgReading = recentDiaries.reduce((sum, d) => sum + (d.ex_reading || 0), 0) / recentDiaries.length;

    const suggestions = [];

    if (!todayDiary) {
      suggestions.push({
        icon: <Lightbulb className="text-yellow-500" size={20} />,
        title: '今日の学習を始めましょう',
        description: `平均的に${Math.round(avgStudyTime)}分の学習をされています。今日も同じくらいの時間を確保してみましょう。`
      });
    } else {
      if ((todayDiary.time || 0) < avgStudyTime * 0.7) {
        suggestions.push({
          icon: <Lightbulb className="text-blue-500" size={20} />,
          title: '学習時間を少し増やしてみましょう',
          description: `今日は${todayDiary.time}分の学習でした。平均の${Math.round(avgStudyTime)}分を目指してみましょう。`
        });
      } else {
        suggestions.push({
          icon: <Sparkles className="text-green-500" size={20} />,
          title: '素晴らしい学習時間です',
          description: `今日は${todayDiary.time}分学習しました。この調子で継続しましょう！`
        });
      }
    }

    const targetDate = selfProfile.by_when ? new Date(selfProfile.by_when) : null;
    if (targetDate) {
      const daysRemaining = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const dailyGoal = Math.ceil((selfProfile.total_train_number || 0) / Math.max(daysRemaining, 1));

      if (daysRemaining > 0) {
        suggestions.push({
          icon: <Target className="text-purple-500" size={20} />,
          title: '目標達成のための1日の目安',
          description: `目標まで残り${daysRemaining}日。1日あたり${dailyGoal}分の学習で目標達成できます。`
        });
      }
    }

    if (avgReading > 0 && (!todayDiary || (todayDiary.ex_reading || 0) < avgReading * 0.5)) {
      suggestions.push({
        icon: <BookOpen className="text-indigo-500" size={20} />,
        title: '多読に取り組みましょう',
        description: `平均${Math.round(avgReading)}語読んでいます。今日は多読の時間を作ってみましょう。`
      });
    }

    const recentTopics = recentDiaries.slice(0, 3).map(d => extractTopicTag(d.self_topic || '')).filter(t => t);
    if (recentTopics.length > 0 && recentTopics.every(t => t === recentTopics[0])) {
      const alternatives = ['文法', '発音', '語彙', 'リスニング', 'スピーキング', 'リーディング', 'ライティング']
        .filter(t => t !== recentTopics[0]);
      suggestions.push({
        icon: <TrendingUp className="text-orange-500" size={20} />,
        title: 'バランスの取れた学習を',
        description: `最近は${recentTopics[0]}に集中しています。${alternatives[0]}や${alternatives[1]}にも取り組んでみましょう。`
      });
    }

    return (
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex-shrink-0 mt-1">{suggestion.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h3>
              <p className="text-sm text-gray-600">{suggestion.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const generateWeeklyPattern = () => {
    if (recentDiaries.length === 0) {
      return <p className="text-gray-600">まだ学習記録がありません</p>;
    }

    const totalTime = recentDiaries.reduce((sum, d) => sum + (d.time || 0), 0);
    const avgTime = totalTime / recentDiaries.length;
    const studyDays = recentDiaries.filter(d => (d.time || 0) > 0).length;
    const totalReading = recentDiaries.reduce((sum, d) => sum + (d.ex_reading || 0), 0);

    const bestDay = recentDiaries.reduce((best, current) =>
      (current.time || 0) > (best.time || 0) ? current : best
    , recentDiaries[0]);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-600 font-medium mb-1">学習日数</p>
            <p className="text-2xl font-bold text-purple-900">{studyDays}<span className="text-sm font-normal">/7日</span></p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-600 font-medium mb-1">平均学習時間</p>
            <p className="text-2xl font-bold text-purple-900">{Math.round(avgTime)}<span className="text-sm font-normal">分</span></p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium mb-1">今週の総学習時間</p>
          <p className="text-2xl font-bold text-purple-900">{totalTime}<span className="text-sm font-normal">分</span></p>
          <p className="text-xs text-purple-600 mt-2">= {Math.floor(totalTime / 60)}時間{totalTime % 60}分</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium mb-1">総多読語数</p>
          <p className="text-2xl font-bold text-purple-900">{totalReading.toLocaleString()}<span className="text-sm font-normal">語</span></p>
        </div>

        {bestDay && (
          <div className="pt-3 border-t border-purple-200">
            <p className="text-sm text-gray-600">
              🏆 <strong>ベストデイ:</strong> {new Date(bestDay.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })} ({bestDay.time}分)
            </p>
          </div>
        )}
      </div>
    );
  };

  const generateSkillSuggestions = () => {
    if (recentDiaries.length === 0) {
      return <p className="text-gray-600">まだ学習記録がありません</p>;
    }

    const skillAreas = {
      s_reading: { name: '精読', total: 0, count: 0 },
      o_speaking: { name: '音読・スピーキング', total: 0, count: 0 },
      listening: { name: 'リスニング', total: 0, count: 0 },
      ex_reading: { name: '多読', total: 0, count: 0 }
    };

    recentDiaries.forEach(diary => {
      if (diary.s_reading > 0) {
        skillAreas.s_reading.total += diary.s_reading;
        skillAreas.s_reading.count++;
      }
      if (diary.o_speaking > 0) {
        skillAreas.o_speaking.total += diary.o_speaking;
        skillAreas.o_speaking.count++;
      }
      if (diary.listening > 0) {
        skillAreas.listening.total += diary.listening;
        skillAreas.listening.count++;
      }
      if (diary.ex_reading > 0) {
        skillAreas.ex_reading.total += diary.ex_reading;
        skillAreas.ex_reading.count++;
      }
    });

    const skillScores = Object.entries(skillAreas).map(([_, data]) => ({
      name: data.name,
      score: data.count,
      avg: data.count > 0 ? Math.round(data.total / data.count) : 0
    })).sort((a, b) => a.score - b.score);

    const weakestSkill = skillScores[0];
    const strongestSkill = skillScores[skillScores.length - 1];

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">スキル別学習頻度（直近7日）</h3>
          <div className="space-y-2">
            {skillScores.map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">{skill.name}</span>
                  <span className="text-sm font-medium text-gray-900">{skill.score}日</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(skill.score / 7) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-orange-200 space-y-2">
          {weakestSkill.score < 3 && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>💡 提案:</strong> {weakestSkill.name}の学習頻度が少なめです。週に3〜4日は取り組んでみましょう。
              </p>
            </div>
          )}
          {strongestSkill.score >= 5 && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-sm text-green-800">
                <strong>👏 素晴らしい:</strong> {strongestSkill.name}はしっかり継続できています！
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const generateNextMilestone = () => {
    if (!selfProfile) {
      return <p className="text-gray-600">プロフィールを設定すると、マイルストーンが表示されます</p>;
    }

    const targetDate = selfProfile.by_when ? new Date(selfProfile.by_when) : null;
    const totalStudyTime = recentDiaries.reduce((sum, d) => sum + (d.time || 0), 0);
    const avgDailyTime = recentDiaries.length > 0 ? totalStudyTime / recentDiaries.length : 0;

    const milestones = [];

    if (targetDate) {
      const daysRemaining = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const targetStudyTime = selfProfile.total_train_number || 0;
      const estimatedAccumulatedTime = avgDailyTime * daysRemaining;
      const progressPercentage = Math.min(100, (estimatedAccumulatedTime / targetStudyTime) * 100);

      milestones.push({
        title: '目標達成予測',
        items: [
          { label: '目標期限', value: targetDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) },
          { label: '残り日数', value: `${daysRemaining}日` },
          { label: '現在のペース', value: `${Math.round(avgDailyTime)}分/日` },
          { label: '予測達成率', value: `${Math.round(progressPercentage)}%`, highlight: progressPercentage >= 100 }
        ]
      });

      if (progressPercentage < 90) {
        const requiredDaily = Math.ceil((targetStudyTime - estimatedAccumulatedTime) / daysRemaining + avgDailyTime);
        milestones.push({
          title: '目標達成に必要なペース',
          items: [
            { label: '必要な1日の学習時間', value: `${requiredDaily}分`, highlight: true },
            { label: '現在との差', value: `+${requiredDaily - Math.round(avgDailyTime)}分` }
          ]
        });
      }
    }

    if (feedback?.readingcumulative !== undefined) {
      const readingTarget = selfProfile.total_reading_number || 0;
      const readingProgress = (feedback.readingcumulative / readingTarget) * 100;
      const remaining = readingTarget - feedback.readingcumulative;

      milestones.push({
        title: '多読目標',
        items: [
          { label: '現在の累積', value: `${feedback.readingcumulative.toLocaleString()}語` },
          { label: '目標', value: `${readingTarget.toLocaleString()}語` },
          { label: '達成率', value: `${Math.round(readingProgress)}%`, highlight: readingProgress >= 50 },
          { label: '残り', value: `${remaining.toLocaleString()}語` }
        ]
      });
    }

    const nextLevelMilestones = {
      '初級': { next: '中級', hours: 300 },
      '中級': { next: '中上級', hours: 500 },
      '中上級': { next: '上級', hours: 800 },
      '上級': { next: 'ネイティブレベル', hours: 1500 }
    };

    const currentLevel = selfProfile.current_level;
    if (currentLevel && nextLevelMilestones[currentLevel as keyof typeof nextLevelMilestones]) {
      const milestone = nextLevelMilestones[currentLevel as keyof typeof nextLevelMilestones];
      const estimatedHours = (avgDailyTime / 60) * 365;
      const yearsToNext = milestone.hours / estimatedHours;

      milestones.push({
        title: `次のレベル（${milestone.next}）への道のり`,
        items: [
          { label: '必要な学習時間', value: `約${milestone.hours}時間` },
          { label: '現在のペース', value: `年間約${Math.round(estimatedHours)}時間` },
          { label: '予測達成期間', value: `約${yearsToNext.toFixed(1)}年` }
        ]
      });
    }

    return (
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">{milestone.title}</h3>
            <div className="space-y-2">
              {milestone.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between items-center">
                  <span className="text-sm text-green-700">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.highlight ? 'text-green-900 bg-green-200 px-2 py-1 rounded' : 'text-green-800'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const formatJSTDate = (): string => {
    const now = new Date();
    const jstOffset = 9 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jstDate = new Date(utc + (jstOffset * 60000));
    return jstDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
            <div className="flex items-center gap-3 flex-1">
              <img src="/ait.png" alt="AI Tutor" className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AIチューターフィードバック</h1>
                <p className="text-gray-600">{formatJSTDate()}</p>
              </div>
            </div>
            {feedback && (
              <button
                onClick={handleRegenerateFeedback}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
                再生成
              </button>
            )}
          </div>
          {feedback && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 ヒント:</strong> 学習日記や各種データを更新した場合は、「再生成」ボタンをクリックして最新のデータに基づいたフィードバックを取得できます。
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {generating && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-700">AIがフィードバックを生成しています...</p>
            <p className="text-sm text-gray-500 mt-2">少々お待ちください</p>
          </div>
        )}

        {!generating && feedback && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={24} className="text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {feedback.advicetype || 'アドバイス'}
                  </h2>
                </div>
                {isNewlyGenerated && (
                  <div className="animate-pulse">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 border-2 border-yellow-400 text-yellow-800 text-sm font-bold rounded-full shadow-md">
                      <Sparkles size={16} />
                      最新データで更新済み
                    </span>
                  </div>
                )}
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                  {feedback.advicetext}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">頑張り具合</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {getConsistencyIcon(feedback.consistencyscore)} {getConsistencyLabel(feedback.consistencyscore)}
                </p>
              </div>

              {feedback.sentimentscore !== null && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">感情スコア</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {feedback.sentimentscore === 1 ? '😊 ポジティブ' :
                     feedback.sentimentscore === -1 ? '😔 ネガティブ' : '😐 中立'}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">累積多読語数</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {feedback.readingcumulative.toLocaleString()}語
                </p>
              </div>

              {feedback.readingpacestatus && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">多読ペース</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {feedback.readingpacestatus === 'ahead' ? '📈 順調' :
                     feedback.readingpacestatus === 'behind' ? '📉 遅れ気味' : '✅ 目標通り'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    目標差: {feedback.readinggapscore > 0 ? '+' : ''}{feedback.readinggapscore}語
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Target className="text-white" size={24} />
                  <h2 className="text-xl font-bold text-white">今日の学習提案</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {generateTodaysSuggestions()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-white" size={24} />
                    <h2 className="text-xl font-bold text-white">週間学習パターン</h2>
                  </div>
                </div>
                <div className="p-6">
                  {generateWeeklyPattern()}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-white" size={24} />
                    <h2 className="text-xl font-bold text-white">スキル強化提案</h2>
                  </div>
                </div>
                <div className="p-6">
                  {generateSkillSuggestions()}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-white" size={24} />
                  <h2 className="text-xl font-bold text-white">次のマイルストーン</h2>
                </div>
              </div>
              <div className="p-6">
                {generateNextMilestone()}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 ポイント:</strong> このフィードバックは本日生成されたものです。同じ日に何度アクセスしても同じ内容が表示されます。
              </p>
            </div>
          </div>
        )}

        {!generating && !feedback && !error && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-700">今日のフィードバックはまだ生成されていません</p>
            <p className="text-sm text-gray-500 mt-2">学習記録を登録すると、AIがフィードバックを生成します</p>
          </div>
        )}
      </div>
    </div>
  );
}
