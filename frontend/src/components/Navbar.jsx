import { LogOut, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <ClipboardList className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-xl text-gray-800">Kanggo Todo App</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Halo, <span className="font-semibold text-gray-800">{user.nama}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
