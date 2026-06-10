import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, TrendingUp } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await login({ email, password });
      // Role checking will occur post login via AuthContext update, redirect handled here
      // But we can fetch status immediately
      const token = localStorage.getItem('alphamind_token');
      if (token) {
        // Successful login
        navigate(email.includes('admin') ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0F172A] px-4 overflow-hidden">
      
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px] glow-blue"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[100px] glow-purple"></div>

      {/* Login Card Container */}
      <div className="relative w-full max-w-md glass rounded-2xl p-8 shadow-2xl animate-slide-up">
        
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 text-white shadow-xl shadow-primary/20 mb-4">
            <TrendingUp size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            AlphaMind
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide">
            Intelligent Stock Analysis & Transparent Scoring
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-sm font-medium animate-fade-in flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@alphamind.com"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 text-sm font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-12 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors duration-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/35 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-300 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                <span>Signing In...</span>
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-[11px] text-slate-500 tracking-wider font-semibold uppercase">
            Powered by AI-Driven Stock Scoring
          </p>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-slate-400">
            <span>Admin: admin@alphamind.com / admin123</span>
            <span>User: user@alphamind.com / user123</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
