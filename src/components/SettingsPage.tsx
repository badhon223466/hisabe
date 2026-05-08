import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { auth } from '../lib/firebase';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { t, language, setLanguage, theme, setTheme } = useApp();
  const navigate = useNavigate();
  const [showCatModal, setShowCatModal] = useState(false);
  const [cats, setCats] = useState<any[]>([]);
  const [newCat, setNewCat] = useState({ name: '', type: 'expense', icon: 'Wallet', color: '#6366f1' });
  const user = auth.currentUser;

  useEffect(() => {
    fetchCats();
  }, []);

  const fetchCats = async () => {
    const data = await api.categories.list();
    setCats(data);
  };

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name) return;

    if (cats.some(c => c.name.toLowerCase() === newCat.name.toLowerCase() && c.type === newCat.type)) {
      alert("This category already exists!");
      return;
    }

    try {
      await api.categories.create(newCat);
      setShowCatModal(false);
      setNewCat({ name: '', type: 'expense', icon: 'Wallet', color: '#6366f1' });
      fetchCats();
    } catch (e) {
      alert("Failed to add category");
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("Are you sure? Transactions in this category might look broken.")) return;
    await api.categories.delete(id);
    fetchCats();
  };

  return (
    <div className="space-y-8 pb-10">
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
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Languages" size={20} className="text-indigo-600" />
              <span className="font-bold text-sm">Language / ভাষা</span>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'bn' | 'en')}
              className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs outline-none"
            >
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Moon" size={20} className="text-indigo-600" />
              <span className="font-bold text-sm">Dark Mode</span>
            </div>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-12 h-6 rounded-full transition-all relative ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <motion.div 
                animate={{ x: theme === 'dark' ? 24 : 2 }}
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm" 
              />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setShowCatModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon name="Grid" size={20} className="text-indigo-600" />
              <span className="font-bold text-sm">Categories / ক্যাটাগরি </span>
            </div>
            <Icon name="PlusCircle" size={18} className="text-slate-400" />
          </button>
          
          <button 
            onClick={() => navigate('/accounts')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-50 dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <Icon name="Building2" size={20} className="text-indigo-600" />
              <span className="font-bold text-sm">Banks / ব্যাংকসমূহ</span>
            </div>
            <Icon name="ChevronRight" size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
          <button onClick={onLogout} className="w-full p-4 flex items-center gap-4 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <Icon name="LogOut" size={20} />
            </div>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </section>

      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-[2.5rem] shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Add Category</h3>
                <button onClick={() => setShowCatModal(false)}><Icon name="X" size={24} /></button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 no-scrollbar pr-2">
                 {cats.map(c => (
                   <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                     <span className="font-medium text-sm">{c.name} ({c.type})</span>
                     <button onClick={() => handleDeleteCat(c.id)} className="text-rose-500 p-1"><Icon name="Trash2" size={14} /></button>
                   </div>
                 ))}
              </div>

              <form onSubmit={handleAddCat} className="space-y-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewCat({...newCat, type: 'expense'})} className={`flex-1 p-3 rounded-xl font-bold text-xs ${newCat.type === 'expense' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Expense</button>
                  <button type="button" onClick={() => setNewCat({...newCat, type: 'income'})} className={`flex-1 p-3 rounded-xl font-bold text-xs ${newCat.type === 'income' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Income</button>
                </div>
                <input 
                  placeholder="Category Name"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                  value={newCat.name}
                  onChange={e => setNewCat({...newCat, name: e.target.value})}
                />
                <button type="submit" className="w-full p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200">Add</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center pt-8">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Smart Manager v1.1.0</p>
      </div>
    </div>
  );
};

export default SettingsPage;
