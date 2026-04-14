import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

type CoachProfileData = {
  type: string;
  character: string;
  target: string;
  speaking: string;
};

type RadioOption = {
  value: string;
  label: string;
  tag: string;
  description: string;
};

const typeOptions: RadioOption[] = [
  {
    value: 'supporter',
    label: 'サポーター型',
    tag: '共感・安心',
    description: '小さな成功を一緒に喜び、失敗しても立て直しながら前向きに進む。孤独を感じさせない伴走スタイル',
  },
  {
    value: 'navigator',
    label: 'ナビゲーター型',
    tag: '論理・最短ルート',
    description: '状況を整理し、無駄を省いて最短ルートで結果を出す。感情より効率を重視したい人向け',
  },
  {
    value: 'trainer',
    label: 'トレーナー型',
    tag: '負荷・行動化',
    description: '少しだけ背中を押し、行動を具体化する。やる気のスイッチを入れてほしいときに最適',
  },
  {
    value: 'mentor',
    label: 'メンター型',
    tag: '意味付け・視座',
    description: '学習を物語化し、成長を可視化する。将来のキャリアや視座も含めて相談したい人に',
  },
];

const characterOptions: RadioOption[] = [
  {
    value: 'detailed',
    label: '詳細に解説',
    tag: '丁寧・網羅的',
    description: 'すべての間違いや改善点を丁寧に説明。しっかり理解を深めたい人向け',
  },
  {
    value: 'key-points',
    label: '重要ポイントのみ',
    tag: 'バランス型',
    description: '学習に直結する重要な点だけを伝える。効率よく核心をつかみたい人に',
  },
  {
    value: 'brief',
    label: '簡潔に要点だけ',
    tag: 'スピード重視',
    description: '最小限の言葉で要点のみ。会話のテンポを止めずに進みたい人向け',
  },
];

const targetOptions: RadioOption[] = [
  {
    value: 'immediate',
    label: '即座に訂正',
    tag: '正確さ重視',
    description: '間違えたらその場ですぐ指摘。正確な英語を身につけたい人に最適',
  },
  {
    value: 'summary',
    label: '後でまとめて',
    tag: '流れ優先',
    description: '会話の流れを止めず、最後に振り返りとしてまとめてフィードバック',
  },
  {
    value: 'critical-only',
    label: '重大なものだけ',
    tag: '自然な会話優先',
    description: '致命的なエラーのみその場で指摘。小さなミスは気にせず流す',
  },
];

const speakingOptions: RadioOption[] = [
  {
    value: 'formal',
    label: '丁寧・フォーマル',
    tag: '敬語スタイル',
    description: '敬語を使って落ち着いた雰囲気でサポート。真面目に取り組みたい人向け',
  },
  {
    value: 'friendly',
    label: 'フレンドリー',
    tag: '親しみやすい',
    description: '親友のような自然な話し方。堅苦しくなく、リラックスして学びたい人に',
  },
  {
    value: 'passionate',
    label: '熱血・情熱的',
    tag: 'エネルギッシュ',
    description: '熱量で引っ張るスタイル。モチベーションが上がりやすい声かけをしてほしい人に',
  },
  {
    value: 'cool',
    label: 'クール・淡々と',
    tag: '客観的スタイル',
    description: '感情を抑えた冗長なコメントなし。データと事実だけで進みたい人向け',
  },
];

type CoachProfileProps = {
  onBack: () => void;
};

export default function CoachProfile({ onBack }: CoachProfileProps) {
  const { userProfile } = useAuth();
  useVitalSync({ userId: userProfile?.id });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<CoachProfileData>({
    type: '',
    character: '',
    target: '',
    speaking: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadCoachProfile();
  }, []);

  const loadCoachProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          type: data.type,
          character: data.character,
          target: data.target,
          speaking: data.speaking,
        });
        setIsEdit(true);
      }
    } catch (error) {
      console.error('Error loading coach profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.character || !formData.target || !formData.speaking) {
      alert('すべての項目を選択してください');
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage('');

      const profileData = {
        user_id: userProfile?.id,
        email: userProfile?.email,
        type: formData.type,
        character: formData.character,
        target: formData.target,
        speaking: formData.speaking,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from('coach_profiles')
          .update(profileData)
          .eq('user_id', userProfile?.id);

        if (error) throw error;
        setSuccessMessage('チュータープロフィールを更新しました');
      } else {
        const { error } = await supabase
          .from('coach_profiles')
          .insert([profileData]);

        if (error) throw error;
        setSuccessMessage('チュータープロフィールを作成しました');
        setIsEdit(true);
      }
    } catch (error) {
      console.error('Error saving coach profile:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
          >
            <ArrowLeft size={18} />
            戻る
          </button>
          <div className="flex items-center gap-3">
            <img src="/aaa1.png" alt="チューター" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">英語講師（チューター）設定</h1>
              <p className="text-gray-600">あなた専属の英語講師（チューター）を選びます</p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">1. タイプ</h2>
            <p className="text-sm text-gray-600 mb-4">英語講師（チューター）の人格スタイル</p>
            <div className="space-y-3">
              {typeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.type === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{option.label}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {option.tag}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">2. 特徴</h2>
            <p className="text-sm text-gray-600 mb-4">フィードバックの詳細度</p>
            <div className="space-y-3">
              {characterOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.character === option.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="character"
                    value={option.value}
                    checked={formData.character === option.value}
                    onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                    className="mt-1 w-4 h-4 text-green-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{option.label}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        {option.tag}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">3. 効果</h2>
            <p className="text-sm text-gray-600 mb-4">間違いの指摘方法</p>
            <div className="space-y-3">
              {targetOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.target === option.value
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value={option.value}
                    checked={formData.target === option.value}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="mt-1 w-4 h-4 text-yellow-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{option.label}</span>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        {option.tag}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">4. 口調</h2>
            <p className="text-sm text-gray-600 mb-4">チューターの話し方スタイル</p>
            <div className="space-y-3">
              {speakingOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.speaking === option.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="speaking"
                    value={option.value}
                    checked={formData.speaking === option.value}
                    onChange={(e) => setFormData({ ...formData, speaking: e.target.value })}
                    className="mt-1 w-4 h-4 text-pink-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{option.label}</span>
                      <span className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded">
                        {option.tag}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              <Save size={24} />
              {saving ? '保存中...' : isEdit ? '設定を更新' : '設定を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
