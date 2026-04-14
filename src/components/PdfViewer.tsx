import { useState, useEffect } from 'react';
import { ArrowLeft, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

type DisplayMode = 'compact' | 'fullscreen' | 'newtab';

interface PDFDocument {
  id: string;
  title: string;
  file_path: string;
  description: string;
  category: string;
}

interface PdfViewerProps {
  onBack: () => void;
  pdf: PDFDocument;
}

export default function PdfViewer({ onBack, pdf }: PdfViewerProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('compact');

  useEffect(() => {
    const savedMode = localStorage.getItem('pdfDisplayMode') as DisplayMode;
    if (savedMode) {
      setDisplayMode(savedMode);
    }
  }, []);

  const handleDisplayModeChange = (mode: DisplayMode) => {
    if (mode === 'newtab') {
      window.open(pdf.file_path, '_blank');
      return;
    }
    setDisplayMode(mode);
    localStorage.setItem('pdfDisplayMode', mode);
  };

  if (displayMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white rounded-lg transition-colors shadow-lg"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">戻る</span>
          </button>

          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
            <button
              onClick={() => handleDisplayModeChange('compact')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="コンパクト表示"
            >
              <Minimize2 size={20} className="text-gray-700" />
            </button>
            <button
              onClick={() => handleDisplayModeChange('newtab')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="新しいタブで開く"
            >
              <ExternalLink size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        <iframe
          src={pdf.file_path}
          className="w-full h-full"
          title={pdf.title}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                戻る
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pdf.title}</h1>
                <p className="text-sm text-gray-600">{pdf.description || 'PDF資料を閲覧'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => handleDisplayModeChange('compact')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  displayMode === 'compact'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="コンパクト表示"
              >
                <Minimize2 size={18} />
                <span className="text-sm font-medium">コンパクト</span>
              </button>
              <button
                onClick={() => handleDisplayModeChange('fullscreen')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  displayMode === 'fullscreen'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="フルスクリーン表示"
              >
                <Maximize2 size={18} />
                <span className="text-sm font-medium">フル</span>
              </button>
              <button
                onClick={() => handleDisplayModeChange('newtab')}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-gray-600 hover:text-gray-900"
                title="新しいタブで開く"
              >
                <ExternalLink size={18} />
                <span className="text-sm font-medium">新規タブ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <iframe
            src={pdf.file_path}
            className="w-full h-[calc(100vh-12rem)]"
            title={pdf.title}
          />
        </div>
      </main>
    </div>
  );
}
