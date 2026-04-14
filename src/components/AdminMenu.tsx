import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Database, Users } from 'lucide-react';
import AdminNotionSettings from './AdminNotionSettings';

type MenuItem = {
  id: string;
  label: string;
  icon: any;
};

export default function AdminMenu() {
  const { userProfile, signOut } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    { id: 'rfdbset', label: 'rfDBset', icon: Database },
    { id: 'member', label: 'Member', icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuClick = (menuId: string) => {
    setSelectedMenu(menuId);
    console.log('Selected menu:', menuId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚙️</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
                <p className="text-sm text-gray-600">ばくまっち管理画面</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userProfile?.email}</p>
                <p className="text-xs text-orange-600 font-semibold">管理者</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">メニュー</h2>
          <p className="text-gray-600">機能を選択してください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-full flex justify-start">
                    <span className="text-2xl font-bold text-orange-600">{index + 1}.</span>
                  </div>
                  <div className="p-4 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Icon size={32} className="text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{item.label}</h3>
                </div>
              </button>
            );
          })}
        </div>

        {selectedMenu === 'rfdbset' && (
          <div className="mt-8">
            <AdminNotionSettings onBack={() => setSelectedMenu(null)} />
          </div>
        )}

        {selectedMenu && selectedMenu !== 'rfdbset' && (
          <div className="mt-8 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">準備中</h3>
              <p className="text-gray-600">
                「{menuItems.find((item) => item.id === selectedMenu)?.label}」機能は現在開発中です
              </p>
              <button
                onClick={() => setSelectedMenu(null)}
                className="mt-6 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                戻る
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
