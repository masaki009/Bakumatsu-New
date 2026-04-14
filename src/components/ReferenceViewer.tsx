import { ArrowLeft } from 'lucide-react';

type ReferenceViewerProps = {
  onBack: () => void;
  title: string;
  imagePath: string;
};

export default function ReferenceViewer({ onBack, title, imagePath }: ReferenceViewerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
          >
            <ArrowLeft size={18} />
            戻る
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600">参考資料</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex justify-center">
            <img
              src={imagePath}
              alt={title}
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
