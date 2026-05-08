import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Account } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

const AccountsList: React.FC = () => {
  const { t } = useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: '', type: 'Cash', balance: 0 });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.accounts.list();
      setAccounts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.name) return;
    await api.accounts.create(newAcc);
    setShowAdd(false);
    setNewAcc({ name: '', type: 'Cash', balance: 0 });
    fetchAccounts();
  };

  if (loading && !showAdd) return <div className="p-20 text-center animate-pulse">{t('loading')}...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold">{t('accounts')}</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100"
        >
          <Icon name="Plus" size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900 shadow-xl"
          >
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                autoFocus
                placeholder="Account Name (e.g. Wallet, Bank)"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                value={newAcc.name}
                onChange={e => setNewAcc({...newAcc, name: e.target.value})}
              />
              <div className="flex gap-2">
                {['Cash', 'Bank', 'MFS'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewAcc({...newAcc, type})}
                    className={`flex-1 p-3 rounded-xl font-bold text-xs ${newAcc.type === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <input 
                type="number"
                placeholder="Initial Balance"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                value={newAcc.balance || ''}
                onChange={e => setNewAcc({...newAcc, balance: Number(e.target.value)})}
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 p-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-bold">Add Account</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 gap-4">
        {accounts.map((acc) => (
          <motion.div
            key={acc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                <Icon name={acc.type === 'Cash' ? 'Wallet' : 'CreditCard'} size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">{acc.name}</h4>
                <p className="text-xs text-slate-400 capitalize">{acc.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">৳ {acc.balance.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Current Balance</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AccountsList;
