// 2026-04-05
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import UserMenu from './components/UserMenu';
import AdminMenu from './components/AdminMenu';

function App() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Login />;
  }

  if (userProfile.role === 'admin') {
    return <AdminMenu />;
  }

  return <UserMenu />;
}

export default App;
