import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { Spinner } from '../components/common/Spinner.jsx';
import { getErrorMessage } from '../utils/errorUtils.js';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 bg-neo-yellow border-3 border-black rounded-2xl shadow-neo items-center justify-center font-black text-2xl mb-2">
            M
          </div>
          <h2 className="text-3xl font-black text-black tracking-tight">
            Welcome to Meeting<span className="bg-black text-neo-yellow px-2 py-0.5 rounded-lg ml-1">OS</span>
          </h2>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Evidence-First Meeting Intelligence
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white border-3 border-black rounded-2xl p-8 shadow-neo space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-start gap-2 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neo-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-xl font-black text-sm tracking-wide text-black shadow-neo hover:shadow-neo-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              {loading ? <Spinner size="sm" /> : <LogIn size={18} />}
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          <div className="pt-4 border-t-2 border-gray-100 text-center text-xs font-bold text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-black text-black underline hover:text-gray-800">
              Create an account
            </Link>
          </div>
        </div>

        {/* Feature guarantee banner */}
        <div className="p-3 bg-amber-50 border-2 border-black rounded-xl text-[11px] font-bold text-black flex items-center justify-center gap-2 shadow-neo-xs">
          <ShieldCheck size={16} className="text-black" />
          <span>Zero Hallucination AI Guarantee: Evidence &gt; Confidence</span>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
