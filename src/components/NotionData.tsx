import { useState } from 'react';
import { RefreshCw, ExternalLink, FileAudio, AlertCircle, Database, Search, Filter, ArrowLeft, Grid2x2 as Grid, List } from 'lucide-react';
import { useNotionData, NotionItem } from '../hooks/useNotionData';

interface NotionDataProps {
  onBack?: () => void;
}

export default function NotionData({ onBack }: NotionDataProps) {
  const { data, loading, error, refetch } = useNotionData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sound.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = Array.from(new Set(data.map(item => item.status).filter(Boolean)));

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case '完了':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
      case '進行中':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not started':
      case '未着手':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600 text-lg">Notionデータを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-xl font-semibold">エラーが発生しました</h2>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={refetch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>再試行</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                )}
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Database className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Notionデータベース</h1>
                  <p className="text-blue-100 mt-1">音声・メディアファイルの管理</p>
                </div>
              </div>
              <button
                onClick={refetch}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>更新</span>
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="名前または音声で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="md:w-64 relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                >
                  <option value="all">すべてのステータス</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'card'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-16">
                <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">データが見つかりませんでした</p>
                <p className="text-gray-400 text-sm mt-2">検索条件を変更してください</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">名前</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ステータス</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">音声</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ファイル</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">リンク</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">更新日時</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item: NotionItem) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {item.name || '無題'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)} inline-block`}>
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.sound && (
                            <div className="flex items-center space-x-2 max-w-sm">
                              <FileAudio className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 truncate">{item.sound}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.files && item.files.length > 0 && (
                            <div className="space-y-1">
                              {item.files.map((file, index) => (
                                <a
                                  key={index}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150"
                                >
                                  <FileAudio className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate max-w-[200px]">{file.name}</span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors duration-150"
                              >
                                <span>URL</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <a
                              href={item.notionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 transition-colors duration-150"
                            >
                              <span>Notion</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(item.lastEditedTime).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map((item: NotionItem) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex-1 line-clamp-2">
                        {item.name || '無題'}
                      </h3>
                      {item.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)} ml-2 whitespace-nowrap`}>
                          {item.status}
                        </span>
                      )}
                    </div>

                    {item.sound && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <FileAudio className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 break-words">{item.sound}</p>
                        </div>
                      </div>
                    )}

                    {item.files && item.files.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ファイル</p>
                        {item.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
                          >
                            <FileAudio className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 transition-colors duration-200"
                        >
                          <span>リンク</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <a
                        href={item.notionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 transition-colors duration-200"
                      >
                        <span>Notionで開く</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        更新: {new Date(item.lastEditedTime).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredData.length}件のアイテム</span>
              <span>全{data.length}件中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
