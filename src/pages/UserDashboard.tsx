import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getMyHistory } from '../services/historyService';
import { SearchHistoryItem } from '../types/history';
import { Search, History, HelpCircle, Activity, TrendingUp, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UserDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getMyHistory();
        setHistory(data);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load search history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSymbol = symbol.trim().toUpperCase();
    if (cleanSymbol) {
      navigate(`/analysis/${cleanSymbol}`);
    }
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return 'bg-slate-800 text-slate-400';
    if (score >= 85) return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60';
    if (score >= 70) return 'bg-blue-950/40 text-blue-400 border border-blue-800/60';
    if (score >= 55) return 'bg-amber-950/40 text-amber-400 border border-amber-800/60';
    if (score >= 40) return 'bg-orange-950/40 text-orange-400 border border-orange-800/60';
    return 'bg-red-950/40 text-red-400 border border-red-800/60';
  };

  const getRecommendationColor = (rec: string | null) => {
    if (!rec) return 'bg-slate-800 text-slate-400';
    const clean = rec.toLowerCase();
    if (clean.includes('strong buy')) return 'text-emerald-400 border-emerald-800/50 bg-emerald-950/20';
    if (clean.includes('buy')) return 'text-blue-400 border-blue-800/50 bg-blue-950/20';
    if (clean.includes('hold')) return 'text-amber-400 border-amber-800/50 bg-amber-950/20';
    if (clean.includes('weak')) return 'text-orange-400 border-orange-800/50 bg-orange-950/20';
    return 'text-red-400 border-red-800/50 bg-red-950/20';
  };

  // Calculations for KPI Cards
  const totalSearches = history.length;
  const latestSearch = history[0] || null;
  const averageScore = totalSearches > 0 
    ? Math.round(history.reduce((sum, item) => sum + (item.final_score || 0), 0) / totalSearches)
    : 0;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 animate-fade-in">
        
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800/60 pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Stock Analysis Dashboard</h2>
            <p className="text-sm text-slate-400 mt-1">
              Search NSE stock symbols to query real-time data and analyze financial quality scores.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-lg w-fit">
            <Activity size={14} className="text-primary animate-pulse" />
            <span>Exchange: NSE (India)</span>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Searches */}
          <div className="glass rounded-2xl p-6 glow-blue flex items-center space-x-5">
            <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400">
              <Search size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Total Queries</span>
              <p className="text-3xl font-extrabold tracking-tight mt-1">{totalSearches}</p>
            </div>
          </div>

          {/* Card 2: Average Rating */}
          <div className="glass rounded-2xl p-6 glow-purple flex items-center space-x-5">
            <div className="p-4 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Average Score</span>
              <p className="text-3xl font-extrabold tracking-tight mt-1">{averageScore}</p>
            </div>
          </div>

          {/* Card 3: Latest Recommendation */}
          <div className="glass rounded-2xl p-6 glow-green flex items-center space-x-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400">
              <History size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Last Analyzed</span>
              <p className="text-xl font-extrabold tracking-tight mt-1 truncate">
                {latestSearch ? `${latestSearch.stock_symbol}` : 'None'}
              </p>
              {latestSearch && (
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wide border px-1.5 py-0.5 rounded-md mt-1 ${getScoreBadgeColor(latestSearch.final_score)}`}>
                  {latestSearch.recommendation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Section: Prominent Search Block */}
        <div className="glass rounded-3xl p-8 md:p-10 relative overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 blur-[80px]"></div>
          
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="text-2xl font-extrabold tracking-tight">Run New Equity Analysis</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Enter any NSE symbol (e.g. <span className="text-blue-400 font-semibold">TCS</span>, <span className="text-blue-400 font-semibold">RELIANCE</span>, <span className="text-blue-400 font-semibold">INFY</span>) to run technical and fundamental scoring engines.
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="Enter Stock Symbol (e.g. TCS)"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 font-semibold tracking-wide"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm tracking-wider hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-lg shadow-primary/20 shrink-0 cursor-pointer"
              >
                Analyze
              </button>
            </form>
          </div>
        </div>

        {/* History Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2">
              <History size={18} className="text-slate-400" />
              <span>Recent Search History</span>
            </h3>
          </div>

          {loading ? (
            <LoadingSpinner message="Retrieving search logs..." />
          ) : error ? (
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 text-center text-red-400 text-sm">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
              <HelpCircle size={48} className="text-slate-600 stroke-[1.5]" />
              <p className="font-semibold text-slate-400">No searches performed yet</p>
              <p className="text-xs text-slate-500 max-w-xs">Your analyzed stocks will appear here with final scores and recommendation summaries.</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden shadow-lg border border-slate-800/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/70 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-4 px-6">Stock Info</th>
                      <th className="py-4 px-6 text-center">Tech Score</th>
                      <th className="py-4 px-6 text-center">Fund Score</th>
                      <th className="py-4 px-6 text-center">Composite Score</th>
                      <th className="py-4 px-6 text-center">Recommendation</th>
                      <th className="py-4 px-6 text-right">Date</th>
                      <th className="py-4 px-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors duration-200">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-200 tracking-wide text-sm">{item.stock_symbol}</div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                            {item.stock_name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${getScoreBadgeColor(item.technical_score)}`}>
                            {item.technical_score ? Math.round(item.technical_score) : '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${getScoreBadgeColor(item.fundamental_score)}`}>
                            {item.fundamental_score ? Math.round(item.fundamental_score) : '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded ${getScoreBadgeColor(item.final_score)}`}>
                            {item.final_score ? Math.round(item.final_score) : '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRecommendationColor(item.recommendation)}`}>
                            {item.recommendation || 'Hold'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-slate-400">
                          {new Date(item.searched_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => navigate(`/analysis/${item.stock_symbol}`)}
                            className="p-1 text-slate-500 hover:text-primary hover:bg-primary/10 rounded transition-all duration-200 cursor-pointer"
                            title="Re-analyze"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default UserDashboard;
