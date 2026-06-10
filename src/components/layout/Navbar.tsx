import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, History, Users, FileText, LogOut, TrendingUp } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-primary bg-primary/10 border-primary' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40';
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-slate-800/80 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <TrendingUp size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AlphaMind
            </span>
            <span className="text-[10px] block text-slate-500 uppercase tracking-widest font-bold -mt-0.5">Stock Intelligence</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-2">
          {/* User Links */}
          <Link
            to="/dashboard"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/dashboard')}`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          
          {/* Admin Links */}
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/admin')}`}
              >
                <Users size={16} />
                <span>User Management</span>
              </Link>
              <Link
                to="/admin/invoices"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/admin/invoices')}`}
              >
                <FileText size={16} />
                <span>Invoice Management</span>
              </Link>
            </>
          ) : null}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 border-r border-slate-800 pr-4">
            {/* Avatar circle */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow shadow-primary/30">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            
            {/* Username and role badge */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-200 tracking-wide">{user.username}</p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isAdmin ? 'bg-purple-900/60 text-purple-300 border border-purple-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-300 cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm font-semibold">Sign Out</span>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
