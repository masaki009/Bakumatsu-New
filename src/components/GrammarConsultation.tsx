import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, PenTool } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CoachProfile {
  type: string;
  character: string;
  target: string;
  speaking: string;
}

interface SelfProfile {
  name: string;
  current_level: string;
  by_when?: string;
  target?: string;
  problem?: string;
  study_type?: string;
}

interface GrammarConsultationProps {
  onBack: () => void;
}

export default function GrammarConsultation({ onBack }: GrammarConsultationProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'こんにちは！英語スキルのサポートをします。英文添削や文法の質問にお答えします。またメンタルや学習に関する悩みごとなど。どんなことでもお気軽にご相談ください。',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [selfProfile, setSelfProfile] = useState<SelfProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;

      try {
        const { data: coachData } = await supabase
          .from('coach_profiles')
          .select('type, character, target, speaking')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: selfData } = await supabase
          .from('self_profiles')
          .select('name, current_level, by_when, target, problem, study_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (coachData) setCoachProfile(coachData);
        if (selfData) setSelfProfile(selfData);
      } catch (err) {
        console.error('プロファイル取得エラー:', err);
      }
    };

    fetchProfiles();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証セッションが見つかりません');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consultation-ai`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: conversationMessages,
          type: 'grammar',
          userId: user.id,
          coachProfile,
          selfProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);

        if (errorData.anthropicError?.includes('authentication_error')) {
          throw new Error('Anthropic APIキーが無効です。正しいAPIキーを設定してください。');
        }

        throw new Error(errorData.error || 'AIからの応答取得に失敗しました');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error calling AI:', err);
      const errorMsg = err instanceof Error ? err.message : 'エラーが発生しました。もう一度お試しください。';
      setError(errorMsg);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `申し訳ございません。${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <PenTool size={24} className="text-rose-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">英語・スキル＆メンタル相談</h1>
                <p className="text-sm text-gray-600">AI学習チューターが英語に関することなんでも回答します</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-rose-500 text-white'
                    : 'bg-white text-gray-900 border border-rose-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-rose-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-rose-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="英文を入力..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
