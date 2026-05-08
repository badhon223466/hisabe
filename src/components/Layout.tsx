import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
import { motion } from 'framer-motion';

const Layout: React.FC = () => {
  const { t, theme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'dashboard', path: '/', icon: 'LayoutDashboard' },
    { name: 'transactions', path: '/transactions', icon: 'ArrowRightLeft' },
    { name: 'accounts', path: '/accounts', icon: 'Wallet' },
    { name: 'loans', path: '/loans', icon: 'Users' },
    { name: 'settings', path: '/settings', icon: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors duration-300">
      <header className="p-4 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">S</div>
          <h1 className="font-bold text-lg">Smart Manager</h1>
        </div>
        <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
          <Icon name="Settings" size={18} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50 shadow-2xl safe-area-pb">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive(item.path) ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Icon name={item.icon} size={isActive(item.path) ? 24 : 20} />
            <span className="text-[10px] font-medium">{t(item.name)}</span>
            {isActive(item.path) && (
              <motion.div
                layoutId="nav-pill"
                className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
