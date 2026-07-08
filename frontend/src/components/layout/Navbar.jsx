import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiUser, FiLogOut, FiChevronDown, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import authStore from '../../store/authStore';
import api from '../../services/api';

export default function Navbar({ onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // silent
    }
    authStore.logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-secondary-200 h-16 flex items-center justify-between px-6">
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
        <FiMenu className="w-5 h-5 text-secondary-600" />
      </button>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-lg hover:bg-secondary-100 transition-colors">
          <FiBell className="w-5 h-5 text-secondary-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <FiUser className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-secondary-700">
              {user?.firstName} {user?.lastName}
            </span>
            <FiChevronDown className="w-4 h-4 text-secondary-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 z-20 py-1">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                >
                  <FiUser className="w-4 h-4 mr-2" /> Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                >
                  <FiSettings className="w-4 h-4 mr-2" /> Settings
                </button>
                <hr className="my-1 border-secondary-200" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
