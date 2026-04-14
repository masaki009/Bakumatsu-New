import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, ArrowLeft, Search, Filter } from 'lucide-react';

interface PDFDocument {
  id: string;
  title: string;
  file_path: string;
  description: string;
  category: string;
  display_order: number;
  created_at: string;
}

interface PDFListProps {
  onBack: () => void;
  onSelectPDF: (pdf: PDFDocument) => void;
}

export default function PDFList({ onBack, onSelectPDF }: PDFListProps) {
  const { user } = useAuth();
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [filteredPdfs, setFilteredPdfs] = useState<PDFDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadPDFs();
  }, []);

  useEffect(() => {
    filterPDFs();
  }, [pdfs, searchQuery, selectedCategory]);

  const loadPDFs = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        setPdfs(data);
        const uniqueCategories = Array.from(new Set(data.map(pdf => pdf.category)));
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error loading PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPDFs = () => {
    let filtered = pdfs;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(pdf => pdf.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pdf =>
        pdf.title.toLowerCase().includes(query) ||
        pdf.description.toLowerCase().includes(query)
      );
    }

    setFilteredPdfs(filtered);
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'error_report': 'エラー報告',
      'manual': 'マニュアル',
      'tutorial': 'チュートリアル',
      'general': '一般',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'error_report': 'bg-red-100 text-red-800',
      'manual': 'bg-blue-100 text-blue-800',
      'tutorial': 'bg-green-100 text-green-800',
      'general': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-slate-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>戻る</span>
              </button>
              <h1 className="text-3xl font-bold text-slate-900">PDF資料</h1>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="タイトルや説明で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-slate-600" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                すべて
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>

          {filteredPdfs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {searchQuery || selectedCategory !== 'all'
                  ? '該当するPDF資料が見つかりませんでした'
                  : 'PDF資料がまだ登録されていません'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPdfs.map(pdf => (
                <div
                  key={pdf.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onSelectPDF(pdf)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(pdf.category)}`}>
                      {getCategoryLabel(pdf.category)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {pdf.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {pdf.description || 'PDF資料'}
                  </p>
                  <div className="mt-4 flex items-center justify-end">
                    <span className="text-sm text-blue-600 group-hover:text-blue-700 font-medium">
                      閲覧 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
