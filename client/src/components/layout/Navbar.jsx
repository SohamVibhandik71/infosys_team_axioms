import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  FileText, 
  PlusCircle, 
  Layers, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: Layers },
    { label: 'Meetings', path: '/meetings', icon: FileText },
    { label: 'New Meeting', path: '/meetings/new', icon: PlusCircle, isHighlight: true },
    { label: 'Ask Meetings', path: '/meetings/ask', icon: MessageSquare }
  ];

  const isActive = (path) => {
    if (path === '/meetings' && location.pathname === '/meetings') return true;
    if (path !== '/meetings' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-40 bg-neo-cream border-b-3 border-black shadow-neo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-neo-yellow border-2 border-black rounded-lg shadow-neo-sm flex items-center justify-center font-black text-xl group-hover:-translate-y-0.5 transition-transform shrink-0 text-black">
              M
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-xl tracking-tight text-black">
                  Meeting
                </span>
                <span className="bg-black text-neo-yellow text-xs font-black px-1.5 py-0.5 rounded-md border border-black shadow-neo-xs">
                  OS
                </span>
              </div>
              <span className="text-[9px] font-extrabold text-gray-600 uppercase tracking-wider mt-1 leading-none">
                Evidence-First Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-black font-bold text-sm transition-all shadow-neo-sm ${
                      link.isHighlight
                        ? 'bg-neo-yellow hover:bg-yellow-300 text-black active:translate-y-0.5'
                        : active
                        ? 'bg-black text-white shadow-neo'
                        : 'bg-white hover:bg-gray-100 text-black active:translate-y-0.5'
                    }`}
                  >
                    <Icon size={16} className={active ? (link.isHighlight ? 'text-black' : 'text-neo-yellow') : 'text-black'} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Desktop Right User / Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-black rounded-lg shadow-neo-sm">
                  <div className="w-7 h-7 bg-amber-200 border-2 border-black rounded-full flex items-center justify-center font-black text-xs text-black">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-black text-black truncate max-w-[120px]">
                    {user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-white hover:bg-rose-300 border-2 border-black rounded-lg shadow-neo-sm transition-colors cursor-pointer"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={16} className="text-black" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 bg-white border-2 border-black rounded-lg font-bold text-sm shadow-neo-sm hover:bg-gray-100 text-black"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-neo-yellow border-2 border-black rounded-lg font-bold text-sm shadow-neo-sm hover:bg-yellow-300 text-black"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-white text-black border-2 border-black rounded-lg shadow-neo-sm"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neo-cream border-t-3 border-black p-4 space-y-2 shadow-neo animate-fadeIn">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 p-2 bg-white border-2 border-black rounded-lg mb-3">
                <div className="w-8 h-8 bg-amber-200 border-2 border-black rounded-full flex items-center justify-center font-black text-sm text-black">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-black text-black">{user?.name}</p>
                  <p className="text-[10px] text-gray-600">{user?.email}</p>
                </div>
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 border-black font-bold text-sm ${
                      active ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-200 hover:bg-rose-300 border-2 border-black rounded-lg font-bold text-sm text-black"
              >
                <LogOut size={18} /> Log Out
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 bg-white border-2 border-black rounded-lg font-bold text-sm"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 bg-neo-yellow border-2 border-black rounded-lg font-bold text-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
