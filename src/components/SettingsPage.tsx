import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { auth } from '../lib/firebase';
import { Icon } from './Icon';
import { motion } from 'framer-motion';

const SettingsPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { t, language, setLanguage, theme, setTheme } = useApp();
  const [seeding, setSeeding] = useState(false);
  const user = auth.currentUser;

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await api.seed.data();
      alert("8 sample items added successfully! Check your dashboard.");
      window.location.href = "/";
    } catch (e) {
      alert("Failed to seed data.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold px-2">{t('settings')}</h2>

      {/* Profile Section */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 border-4 border-white dark:border-slate-800 flex items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-indigo-600 uppercase">{user?.displayName?.charAt(0)}</span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg leading-none">{user?.displayName}</h3>
          <p className="text-sm text-slate-400 mt-2">{user?.email}</p>
        </div>
      </section>

      {/* App Options */}
      <section className="space-y-3">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800">
          <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="BarChart3" size={20} className="text-slate-400" />
              <span className="font-bold text-sm">Language / ভাষা</span>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'bn' | 'en')}
              className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs"
            >
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Zap" size={20} className="text-slate-400" />
              <span className="font-bold text-sm">Dark Mode</span>
            </div>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <motion.div 
                animate={{ x: theme === 'dark' ? 24 : 2 }}
                className="w-5 h-5 bg-white rounded-full absolute top-0.5" 
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800">
          <button 
             onClick={handleSeedData}
             disabled={seeding}
             className="w-full p-4 flex items-center gap-4 text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/10 disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Icon name="GraduationCap" size={20} />
            </div>
            <div className="text-left flex-1">
                <p className="text-sm">Seed Sample Data (8 Items)</p>
                <p className="text-[10px] text-slate-400 font-medium">Add 8 transactions for testing</p>
            </div>
            {seeding && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800">
          <button onClick={onLogout} className="w-full p-4 flex items-center gap-4 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <Icon name="ArrowRightLeft" size={20} />
            </div>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </section>

      <div className="text-center pt-4">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Smart Manager v1.0.0</p>
      </div>
    </div>
  );
};

export default SettingsPage;
