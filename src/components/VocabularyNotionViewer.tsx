import { useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';

interface VocabularyNotionViewerProps {
  onBack?: () => void;
}

export default function VocabularyNotionViewer({ onBack }: VocabularyNotionViewerProps) {
  const notionUrl = 'https://www.notion.so/32b8e70327b38008a5b9ec606f3c504d?v=32b8e70327b381a290b3000cd2954973';
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      window.open(notionUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
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
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ボキャブラ</h1>
              <p className="text-sm text-gray-600">語彙学習データベース</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="p-5 bg-green-100 rounded-full">
            <ExternalLink className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">Notionを開きました</p>
            <p className="text-sm text-gray-500 mt-1">新しいタブでNotionが開かれました</p>
          </div>
          <button
            onClick={() => window.open(notionUrl, '_blank', 'noopener,noreferrer')}
            className="text-sm text-green-600 hover:text-green-800 underline underline-offset-2"
          >
            再度開く
          </button>
        </div>
      </div>
    </div>
  );
}
