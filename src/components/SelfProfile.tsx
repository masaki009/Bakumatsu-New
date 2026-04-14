import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVitalSync } from '../hooks/useVitalSync';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, User } from 'lucide-react';

type SelfProfileData = {
  name: string;
  line_user_id: string;
  current_level: string;
  by_when: string;
  target: string;
  problem: string;
  study_type: string;
  total_train_number: number;
  total_reading_number: number;
  birth: string;
};

const cefrLevels = [
  { value: 'A1', label: 'A1', description: '初級 - 基礎的な表現が理解できる' },
  { value: 'A2', label: 'A2', description: '初級 - 日常的な表現が理解できる' },
  { value: 'B1', label: 'B1', description: '中級 - 身近な話題について理解できる' },
  { value: 'B2', label: 'B2', description: '中級 - 複雑な文章の要点が理解できる' },
  { value: 'C1', label: 'C1', description: '上級 - 幅広い話題を自然に表現できる' },
  { value: 'C2', label: 'C2', description: '上級 - ほぼネイティブレベル' },
];

type SelfProfileProps = {
  onBack: () => void;
};

export default function SelfProfile({ onBack }: SelfProfileProps) {
  const { userProfile } = useAuth();
  useVitalSync({ userId: userProfile?.id });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<SelfProfileData>({
    name: '',
    line_user_id: '',
    current_level: '',
    by_when: '',
    target: '',
    problem: '',
    study_type: '',
    total_train_number: 0,
    total_reading_number: 0,
    birth: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSelfProfile();
  }, []);

  const loadSelfProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('self_profiles')
        .select('*')
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || '',
          line_user_id: data.line_user_id || '',
          current_level: data.current_level || '',
          by_when: data.by_when || '',
          target: data.target || '',
          problem: data.problem || '',
          study_type: data.study_type || '',
          total_train_number: data.total_train_number || 0,
          total_reading_number: data.total_reading_number || 0,
          birth: data.birth || '',
        });
        setIsEdit(true);
      }
    } catch (error) {
      console.error('Error loading self profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.current_level) {
      alert('学習者名と学習レベルは必須項目です');
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage('');

      const profileData = {
        user_id: userProfile?.id,
        email: userProfile?.email,
        name: formData.name,
        line_user_id: formData.line_user_id,
        current_level: formData.current_level,
        by_when: formData.by_when || null,
        target: formData.target,
        problem: formData.problem,
        study_type: formData.study_type,
        total_train_number: formData.total_train_number,
        total_reading_number: formData.total_reading_number,
        birth: formData.birth || null,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from('self_profiles')
          .update(profileData)
          .eq('user_id', userProfile?.id);

        if (error) throw error;
        setSuccessMessage('プロフィールを更新しました');
      } else {
        const { error } = await supabase
          .from('self_profiles')
          .insert([profileData]);

        if (error) throw error;
        setSuccessMessage('プロフィールを作成しました');
        setIsEdit(true);
      }
    } catch (error) {
      console.error('Error saving self profile:', error);
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
            <User size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">セルフプロフィール</h1>
              <p className="text-gray-600">あなた自身のプロフィールを登録します</p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">自動記入</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学習者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="お名前を入力してください"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LINE User ID
                </label>
                <input
                  type="text"
                  value={formData.line_user_id}
                  onChange={(e) => setFormData({ ...formData, line_user_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="LINE User IDを入力してください（任意）"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              学習レベル（CEFR） <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">現在の英語レベルを選択してください</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cefrLevels.map((level) => (
                <label
                  key={level.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.current_level === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="current_level"
                    value={level.value}
                    checked={formData.current_level === level.value}
                    onChange={(e) => setFormData({ ...formData, current_level: e.target.value })}
                    className="mt-1 w-4 h-4 text-blue-600"
                    required
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">{level.label}</div>
                    <p className="text-sm text-gray-600">{level.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">学習目標</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  いつまで（目標日）
                </label>
                <input
                  type="date"
                  value={formData.by_when}
                  onChange={(e) => setFormData({ ...formData, by_when: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標（どうなりたい）
                </label>
                <textarea
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="達成したい目標を入力してください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  課題
                </label>
                <textarea
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="現在の課題や困っていることを入力してください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学習ペース
                </label>
                <input
                  type="text"
                  value={formData.study_type}
                  onChange={(e) => setFormData({ ...formData, study_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：週3回、毎日30分など"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">定量的学習目標</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表現を増やす、苦手な音を克服する数
                </label>
                <input
                  type="number"
                  value={formData.total_train_number}
                  onChange={(e) => setFormData({ ...formData, total_train_number: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  総多読・音読数
                </label>
                <input
                  type="number"
                  value={formData.total_reading_number}
                  onChange={(e) => setFormData({ ...formData, total_reading_number: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">誕生日</h2>
            <p className="text-sm text-gray-600 mb-4">占いやバイオリズムを利用する場合は記入してください。yyyy/mm/ddの形式でお願いします</p>

            <div>
              <input
                type="date"
                value={formData.birth}
                onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="yyyy/mm/dd"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              <Save size={24} />
              {saving ? '保存中...' : isEdit ? 'プロフィールを更新' : 'プロフィールを保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
