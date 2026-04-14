import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Zap, User, TrendingUp, Settings, ArrowLeft, MessageSquare, FileText, BookOpen, Wrench, UserCog, Mic, Music, Apple, Activity, MessageCircle, PenTool, Sparkles, Droplet, Hash, Database, Headphones, Target, Egg, FastForward, Bookmark, AlignLeft, Scissors, Languages, Volume2 } from 'lucide-react';
import CoachProfile from './CoachProfile';
import SelfProfile from './SelfProfile';
import ReportSubmit from './ReportSubmit';
import History from './History';
import DigitalPetDashboard from './DigitalPetDashboard';
import DigitalPetOnboarding from './DigitalPetOnboarding';
import ExReading from './ExReading';
import ExtensiveReadingLog from './ExtensiveReadingLog';
import AudioMemoryGame from './AudioMemoryGame';
import AICoachFeedback from './AICoachFeedback';
import { PomodoroTimer } from './PomodoroTimer';
import Biorhythm from './Biorhythm';
import GrammarConsultation from './GrammarConsultation';
import FourPillarsLearning from './FourPillarsLearning';
import NumerologyCoach from './NumerologyCoach';
import BloodTypeLearning from './BloodTypeLearning';
import NotionData from './NotionData';
import ChunkNotionViewer from './ChunkNotionViewer';
import VocabularyNotionViewer from './VocabularyNotionViewer';
import EnglishListeningPractice from './EnglishListeningPractice';
import BaseballVocabulary from './BaseballVocabulary';
import ReferenceViewer from './ReferenceViewer';
import LinkCollection from './LinkCollection';
import WordOrderQuiz from './WordOrderQuiz';
import SlashReading from './SlashReading';
import JapaneseToEnglishProcess from './JapaneseToEnglishProcess';
import SoundChangeChunk from './SoundChangeChunk';
import SoundChangeDictation from './SoundChangeDictation';
import ChallengeMenu from './ChallengeMenu';
import { useGameData } from '../hooks/useGameData';

type SubMenuItem = {
  id: string;
  label: string;
  icon: any;
  url?: string;
  notionBadge?: 'arrow' | 'plain';
};

type MainMenuItem = {
  id: string;
  label: string;
  subtitle: string;
  icon: any;
  subItems: SubMenuItem[];
};

export default function UserMenu() {
  const { user, userProfile, signOut } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [selectedSubMenu, setSelectedSubMenu] = useState<string | null>(null);
  const { vital, preVital, loading: gameLoading, initializeNewUser } = useGameData(user?.id, user?.email);

  useEffect(() => {
    if (selectedSubMenu === 'digital-pet-dashboard' && !gameLoading && preVital && !vital) {
      initializeNewUser();
    }
  }, [selectedSubMenu, gameLoading, preVital, vital]);

  const menuItems: MainMenuItem[] = [
    {
      id: 'challenge',
      label: 'チャレンジ',
      subtitle: 'ドリルや問題にチャレンジするよ',
      icon: Zap,
      subItems: [
        { id: 'slash-reading', label: 'スラッシュリーディング', icon: Scissors },
        { id: 'ex-reading', label: '多読速読音読', icon: Mic },
        { id: 'word-order-quiz', label: '語順クイズ', icon: AlignLeft },
        { id: 'japanese-english-process', label: '和英プロセス練習', icon: Languages },
        { id: 'baseball-vocabulary', label: '英単語100本ノック', icon: Target, notionBadge: 'arrow' },
        { id: 'vocabulary', label: 'ボキャブラ　直接アクセス', icon: BookOpen, notionBadge: 'plain' },
        { id: 'listening-practice', label: 'リスニング練習', icon: Headphones },
        { id: 'audio-memory', label: '音声神経衰弱', icon: Music, notionBadge: 'arrow' },
        { id: 'sound-change-chunk', label: '音変化チャンク', icon: Volume2 },
        { id: 'sound-change-dictation', label: '音変化チャンクディクテーション', icon: Mic },
        { id: 'chunk', label: 'チャンク　直接アクセス', icon: Database, notionBadge: 'plain' },
      ],
    },
    {
      id: 'mypage',
      label: 'マイページ',
      subtitle: '学習状態の確認や提案',
      icon: User,
      subItems: [
        { id: 'ai-feedback', label: '英語講師（チューター）フィードバック', icon: MessageSquare },
        { id: 'digital-pet-dashboard', label: 'ばくまっち', icon: Egg },
        { id: 'biorhythm', label: 'バイオリズム', icon: Activity },
        { id: 'four-pillars-learning', label: '本日の学習提案 /　四柱推命', icon: Sparkles },
        { id: 'numerology-coach', label: '本日の学習提案 /　数秘術', icon: Hash },
        { id: 'blood-type-learning', label: '血液型＋週の学習提案', icon: Droplet },
      ],
    },
    {
      id: 'growth',
      label: '成長記録',
      subtitle: '日報や多読数などの記録',
      icon: TrendingUp,
      subItems: [
        { id: 'daily-report', label: '日報登録', icon: FileText },
        { id: 'history', label: 'History', icon: TrendingUp },
        { id: 'extensive-reading', label: '多読貯金', icon: BookOpen },
      ],
    },
    {
      id: 'consulting',
      label: 'コンサルティング',
      subtitle: '英語講師（チューター）に相談',
      icon: MessageCircle,
      subItems: [
        { id: 'grammar-consultation', label: '英語に関するスキル・メンタル相談全般の回答します', icon: PenTool },
      ],
    },
    {
      id: 'profile-settings',
      label: 'プロフィール設定',
      subtitle: '英語講師（チューター）＆自分自身のプロフィール',
      icon: Settings,
      subItems: [
        { id: 'coach-settings', label: '英語講師（チューター）設定', icon: UserCog },
        { id: 'self-settings', label: 'セルフ設定', icon: User },
      ],
    },
    {
      id: 'tools',
      label: 'ツール',
      subtitle: 'ユーザーマニュアル＆便利ツール',
      icon: Wrench,
      subItems: [
        { id: 'link-collection', label: 'リンク集', icon: Bookmark },
        { id: 'pomodoro', label: 'ポモドーロ', icon: Apple },
        { id: 'tadoku-reference', label: '多読参考資料', icon: BookOpen },
        { id: 'sokudo-reference', label: '速読参考資料', icon: FastForward },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSubMenuClick = (subItemId: string, url?: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      setSelectedSubMenu(subItemId);
    }
  };

  const handleBackToSubMenu = () => {
    setSelectedSubMenu(null);
  };

  const currentMenu = menuItems.find((item) => item.id === selectedMenu);

  if (selectedSubMenu === 'ai-feedback') {
    return <AICoachFeedback onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'coach-settings') {
    return <CoachProfile onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'self-settings') {
    return <SelfProfile onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'daily-report') {
    return <ReportSubmit onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'history') {
    return <History onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'ex-reading') {
    return <ExReading onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'extensive-reading') {
    return <ExtensiveReadingLog onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'audio-memory') {
    return <AudioMemoryGame onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'pomodoro') {
    return <PomodoroTimer onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'biorhythm') {
    return <Biorhythm onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'digital-pet-dashboard') {
    if (gameLoading || (preVital && !vital)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{!preVital ? '読み込み中...' : '今日のデータを作成中...'}</p>
          </div>
        </div>
      );
    }

    if (!preVital) {
      return <DigitalPetOnboarding onComplete={initializeNewUser} />;
    }

    return <DigitalPetDashboard onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'grammar-consultation') {
    return <GrammarConsultation onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'four-pillars-learning') {
    return <FourPillarsLearning onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'numerology-coach') {
    return <NumerologyCoach onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'blood-type-learning') {
    return <BloodTypeLearning onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'tadoku-reference') {
    return <ReferenceViewer onBack={handleBackToSubMenu} title="多読参考資料" imagePath="/tadoku.png" />;
  }

  if (selectedSubMenu === 'sokudo-reference') {
    return <ReferenceViewer onBack={handleBackToSubMenu} title="速読参考資料" imagePath="/sokudoku.png" />;
  }

  if (selectedSubMenu === 'chunk') {
    return <ChunkNotionViewer onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'vocabulary') {
    return <VocabularyNotionViewer onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'listening-practice') {
    return <EnglishListeningPractice onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'baseball-vocabulary') {
    return <BaseballVocabulary onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'link-collection') {
    return <LinkCollection onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'word-order-quiz') {
    return <WordOrderQuiz onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'slash-reading') {
    return <SlashReading onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'japanese-english-process') {
    return <JapaneseToEnglishProcess onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'sound-change-chunk') {
    return <SoundChangeChunk onBack={handleBackToSubMenu} />;
  }

  if (selectedSubMenu === 'sound-change-dictation') {
    return <SoundChangeDictation onBack={handleBackToSubMenu} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <span className="text-3xl sm:text-4xl flex-shrink-0">🐣</span>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-2xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">幕末英語術　ばくまっち</h1>
                <p className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">英語学習併走スタイル</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userProfile?.email}</p>
                <p className="text-xs text-gray-500">学習者</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">ログアウト</span>
                <span className="sm:hidden">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedMenu ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">メニュー</h2>
              <p className="text-gray-600">機能を選択してください</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMenu(item.id)}
                    className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-full flex justify-start">
                        <span className="text-2xl font-bold text-blue-600">{index + 1}.</span>
                      </div>
                      <div className="p-4 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Icon size={32} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{item.label}</h3>
                        <p className="text-sm text-gray-500">{item.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-8 flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedMenu(null);
                  setSelectedSubMenu(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
              >
                <ArrowLeft size={18} />
                戻る
              </button>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{currentMenu?.label}</h2>
                <p className="text-gray-600">項目を選択してください</p>
              </div>
            </div>

{selectedMenu === 'challenge' ? (
              <ChallengeMenu subItems={currentMenu?.subItems ?? []} onItemClick={handleSubMenuClick} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentMenu?.subItems.map((subItem) => {
                  const isImageIcon = typeof subItem.icon === 'string';
                  const SubIcon = isImageIcon ? null : subItem.icon;
                  const isAIFeedback = subItem.id === 'ai-feedback';
                  const isDigitalPet = subItem.id === 'digital-pet-dashboard';

                  const bgColor = isAIFeedback ? 'bg-green-50' : isDigitalPet ? 'bg-yellow-50' : 'bg-white';
                  const borderHoverColor = isAIFeedback ? 'hover:border-green-500' : isDigitalPet ? 'hover:border-yellow-500' : 'hover:border-green-500';
                  const iconBgColor = isAIFeedback ? 'bg-green-100' : isDigitalPet ? 'bg-yellow-100' : 'bg-green-100';
                  const iconBgHoverColor = isAIFeedback ? 'group-hover:bg-green-200' : isDigitalPet ? 'group-hover:bg-yellow-200' : 'group-hover:bg-green-200';
                  const iconColor = isAIFeedback ? 'text-green-600' : isDigitalPet ? 'text-yellow-600' : 'text-green-600';

                  return (
                    <button
                      key={subItem.id}
                      onClick={() => handleSubMenuClick(subItem.id, subItem.url)}
                      className={`${bgColor} rounded-xl p-8 border-2 border-gray-200 ${borderHoverColor} hover:shadow-lg transition-all group`}
                    >
                      <div className="text-center">
                        {isImageIcon ? (
                          <div className="mb-4 inline-block">
                            <img src={subItem.icon as string} alt={subItem.label} className="w-16 h-16 mx-auto object-contain" />
                          </div>
                        ) : (
                          <div className={`mb-4 inline-block p-4 ${iconBgColor} rounded-full ${iconBgHoverColor} transition-colors`}>
                            {SubIcon && <SubIcon size={32} className={iconColor} />}
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-gray-900">{subItem.label}</h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
