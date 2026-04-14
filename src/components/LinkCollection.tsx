import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, CreditCard as Edit2, Trash2, ExternalLink, GripVertical, Bookmark, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLinks } from '../hooks/useLinks';
import { Link } from '../lib/supabase';

interface LinkCollectionProps {
  onBack: () => void;
}

interface LinkFormData {
  title: string;
  url: string;
  description: string;
  category: string;
  favicon_url: string;
  thumbnail_url: string;
}

export default function LinkCollection({ onBack }: LinkCollectionProps) {
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const { links, loading, error, addLink, updateLink, deleteLink, reorderLinks } = useLinks(user?.id || null, isAdmin);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isCommonLink, setIsCommonLink] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Link | null>(null);

  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    url: '',
    description: '',
    category: '',
    favicon_url: '',
    thumbnail_url: '',
  });

  const categories = useMemo(() => {
    const cats = new Set(links.map(link => link.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [links]);

  const filteredLinks = useMemo(() => {
    let filtered = links;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(link => link.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(link =>
        link.title.toLowerCase().includes(query) ||
        link.description.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [links, selectedCategory, searchQuery]);

  const commonLinks = filteredLinks.filter(link => link.user_id === null);
  const personalLinks = filteredLinks.filter(link => link.user_id !== null);

  const handleOpenModal = (link?: Link, isCommon = false) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        title: link.title,
        url: link.url,
        description: link.description,
        category: link.category,
        favicon_url: link.favicon_url || '',
        thumbnail_url: link.thumbnail_url || '',
      });
      setIsCommonLink(link.user_id === null);
    } else {
      setEditingLink(null);
      setFormData({
        title: '',
        url: '',
        description: '',
        category: '',
        favicon_url: '',
        thumbnail_url: '',
      });
      setIsCommonLink(isCommon);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLink(null);
    setFormData({
      title: '',
      url: '',
      description: '',
      category: '',
      favicon_url: '',
      thumbnail_url: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.url) {
      alert('タイトルとURLは必須です');
      return;
    }

    const linkData = {
      ...formData,
      user_id: isCommonLink ? null : user?.id || null,
      favicon_url: formData.favicon_url || null,
      thumbnail_url: formData.thumbnail_url || null,
      order_index: 0,
    };

    if (editingLink) {
      const result = await updateLink(editingLink.id, linkData);
      if (result.success) {
        handleCloseModal();
      } else {
        alert(result.error);
      }
    } else {
      const result = await addLink(linkData);
      if (result.success) {
        handleCloseModal();
      } else {
        alert(result.error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このリンクを削除しますか？')) return;

    const result = await deleteLink(id);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleDragStart = (e: React.DragEvent, link: Link) => {
    setDraggedItem(link);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLink: Link) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetLink.id) return;

    const isCommonSection = targetLink.user_id === null;
    const sourceLinks = isCommonSection ? commonLinks : personalLinks;

    const draggedIndex = sourceLinks.findIndex(l => l.id === draggedItem.id);
    const targetIndex = sourceLinks.findIndex(l => l.id === targetLink.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLinks = [...sourceLinks];
    const [removed] = newLinks.splice(draggedIndex, 1);
    newLinks.splice(targetIndex, 0, removed);

    reorderLinks(newLinks);
    setDraggedItem(null);
  };

  const getFaviconUrl = (url: string, faviconUrl: string | null) => {
    if (faviconUrl) return faviconUrl;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const LinkCard = ({ link }: { link: Link }) => {
    const canEdit = link.user_id === user?.id || (link.user_id === null && isAdmin);
    const faviconUrl = getFaviconUrl(link.url, link.favicon_url);

    return (
      <div
        draggable={canEdit}
        onDragStart={(e) => handleDragStart(e, link)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, link)}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-move"
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              {canEdit && (
                <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              )}
              {faviconUrl && (
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{link.title}</h3>
                {link.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {link.category}
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => handleOpenModal(link)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="編集"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {link.thumbnail_url && (
            <img
              src={link.thumbnail_url}
              alt={link.title}
              className="w-full h-32 object-cover rounded mb-3"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {link.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{link.description}</p>
          )}

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            リンクを開く
          </a>

          {link.user_id === null && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">共通リンク</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Bookmark className="w-8 h-8 text-blue-600" />
                  リンク集
                </h1>
                <p className="text-gray-600 mt-1">学習に役立つリンクを一元管理</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenModal(undefined, false)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                個人リンク追加
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleOpenModal(undefined, true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  共通リンク追加
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="リンクを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'すべてのカテゴリー' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {commonLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-purple-600" />
              共通リンク
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commonLinks.map(link => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        )}

        {personalLinks.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-blue-600" />
              個人リンク
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalLinks.map(link => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        )}

        {filteredLinks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery || selectedCategory !== 'all'
                ? 'リンクが見つかりませんでした'
                : 'まだリンクがありません。追加してみましょう！'}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingLink ? 'リンクを編集' : isCommonLink ? '共通リンクを追加' : '個人リンクを追加'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明文
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 英語学習、プログラミング"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サムネイル画像URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ファビコンURL（省略可）
                  </label>
                  <input
                    type="url"
                    value={formData.favicon_url}
                    onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="自動取得されます"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingLink ? '更新' : '追加'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
