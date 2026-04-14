import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Search, Save, Plus, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface NotionSetting {
  id?: string;
  email: string;
  notion_api_key: string;
  db_id_vocab: string;
  db_id_chunk: string;
  db_id_jtoe: string;
  db_id_simul: string;
}

const EMPTY_FORM: NotionSetting = {
  email: '',
  notion_api_key: '',
  db_id_vocab: '',
  db_id_chunk: '',
  db_id_jtoe: '',
  db_id_simul: '',
};

interface AdminNotionSettingsProps {
  onBack: () => void;
}

export default function AdminNotionSettings({ onBack }: AdminNotionSettingsProps) {
  const [records, setRecords] = useState<NotionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [form, setForm] = useState<NotionSetting>(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_notion')
      .select('id, email, notion_api_key, db_id_vocab, db_id_chunk, db_id_jtoe, db_id_simul')
      .order('email');

    if (error) {
      setMessage({ type: 'error', text: `読み込みエラー: ${error.message}` });
    } else {
      setRecords(data ?? []);
    }
    setLoading(false);
  };

  const handleSelect = (record: NotionSetting) => {
    setSelectedEmail(record.email);
    setForm({ ...record });
    setIsNew(false);
    setMessage(null);
    setShowKey(false);
  };

  const handleNew = () => {
    setSelectedEmail(null);
    setForm(EMPTY_FORM);
    setIsNew(true);
    setMessage(null);
    setShowKey(false);
  };

  const handleSave = async () => {
    if (!form.email) {
      setMessage({ type: 'error', text: 'メールアドレスは必須です' });
      return;
    }
    setSaving(true);
    setMessage(null);

    const payload = {
      email: form.email,
      notion_api_key: form.notion_api_key,
      db_id_vocab: form.db_id_vocab,
      db_id_chunk: form.db_id_chunk,
      db_id_jtoe: form.db_id_jtoe,
      db_id_simul: form.db_id_simul,
    };

    const { error } = await supabase
      .from('user_notion')
      .upsert(payload, { onConflict: 'email' });

    if (error) {
      setMessage({ type: 'error', text: `保存エラー: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: '保存しました' });
      await loadRecords();
      setIsNew(false);
      setSelectedEmail(form.email);
    }
    setSaving(false);
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`「${email}」の設定を削除しますか？`)) return;

    const { error } = await supabase
      .from('user_notion')
      .delete()
      .eq('email', email);

    if (error) {
      setMessage({ type: 'error', text: `削除エラー: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: '削除しました' });
      if (selectedEmail === email) {
        setSelectedEmail(null);
        setForm(EMPTY_FORM);
        setIsNew(false);
      }
      await loadRecords();
    }
  };

  const filteredRecords = records.filter((r) =>
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fields: { key: keyof NotionSetting; label: string; placeholder: string }[] = [
    { key: 'db_id_vocab', label: '語彙 DB ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'db_id_chunk', label: 'チャンク DB ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'db_id_jtoe', label: '日英変換 DB ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'db_id_simul', label: '同時通訳 DB ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-lg border border-gray-200 transition-colors"
          >
            <ArrowLeft size={16} />
            戻る
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notion設定管理 (rfDBset)</h1>
            <p className="text-sm text-gray-500">ユーザーごとのNotionAPIキーとDBIDを管理します</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="メールで検索..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <button
                    onClick={loadRecords}
                    className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="更新"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <button
                  onClick={handleNew}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  新規追加
                </button>
              </div>

              <div className="overflow-y-auto max-h-96">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">データがありません</p>
                ) : (
                  filteredRecords.map((record) => (
                    <div
                      key={record.email}
                      onClick={() => handleSelect(record)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                        selectedEmail === record.email
                          ? 'bg-orange-50 border-l-2 border-l-orange-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm text-gray-700 truncate flex-1">{record.email}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record.email);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">{records.length} 件</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {(selectedEmail !== null || isNew) ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  {isNew ? '新規ユーザー設定' : `${selectedEmail} の設定`}
                </h2>

                {message && (
                  <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={!isNew}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        !isNew ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                      }`}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notion API キー
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={form.notion_api_key}
                        onChange={(e) => setForm({ ...form, notion_api_key: e.target.value })}
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="secret_xxxxxxxxxxxx"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={form[key] as string}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <Save size={16} />
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <p className="text-sm">左のリストからユーザーを選択するか</p>
                  <p className="text-sm">「新規追加」ボタンで新しい設定を作成してください</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
