import { useEffect, useRef } from 'react';
import { ArrowLeft, Database, RefreshCw, AlertTriangle, Lock, ExternalLink } from 'lucide-react';
import { useUserNotionData } from '../hooks/useUserNotionData';

interface ChunkNotionViewerProps {
  onBack?: () => void;
}

export default function ChunkNotionViewer({ onBack }: ChunkNotionViewerProps) {
  const { loading, error, notionDbUrl, refetch } = useUserNotionData('chunk');
  const opened = useRef(false);

  useEffect(() => {
    if (!loading && notionDbUrl && !opened.current) {
      opened.current = true;
      window.open(notionDbUrl, '_blank', 'noopener,noreferrer');
    }
  }, [loading, notionDbUrl]);

  const isUpgradeNeeded = error?.includes('アップグレード');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
            )}
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">チャンク</h1>
              <p className="text-sm text-gray-500">学習データベース</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm">Notionのデータを取得中...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center text-center max-w-md w-full">
            {isUpgradeNeeded ? (
              <>
                <div className="p-4 bg-amber-50 rounded-full mb-4">
                  <Lock className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Notion設定が未完了です</h2>
                <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                  このコンテンツを利用するにはアップグレードが必要です。<br />
                  事務局までご連絡ください。
                </p>
              </>
            ) : (
              <>
                <div className="p-4 bg-red-50 rounded-full mb-4">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
                <p className="text-gray-500 mb-2 max-w-sm text-sm leading-relaxed">{error}</p>
                <p className="text-gray-400 text-sm mb-6">問題が続く場合は事務局にお問い合わせください。</p>
                <button
                  onClick={refetch}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  再試行
                </button>
              </>
            )}
          </div>
        )}

        {!loading && !error && notionDbUrl && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="p-5 bg-blue-100 rounded-full">
              <ExternalLink className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">Notionを開きました</p>
              <p className="text-sm text-gray-500 mt-1">新しいタブでNotionが開かれました</p>
            </div>
            <button
              onClick={() => window.open(notionDbUrl, '_blank', 'noopener,noreferrer')}
              className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              再度開く
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
