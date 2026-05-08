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
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [newAcc, setNewAcc] = useState({ name: '', type: 'Cash', balance: 0 });

  const ACCOUNT_TYPES = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Upay', 'DBBL', 'IBBL'];

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

    // Check for duplicates
    const isDuplicate = accounts.some(acc => 
      acc.name.toLowerCase() === newAcc.name.toLowerCase() && 
      (!editingAcc || acc.id !== editingAcc.id)
    );

    if (isDuplicate) {
      alert("An account with this name already exists! Please choose a different name.");
      return;
    }

    try {
      if (editingAcc) {
        await api.accounts.update(editingAcc.id.toString(), newAcc);
      } else {
        await api.accounts.create(newAcc);
      }
      setShowAdd(false);
      setEditingAcc(null);
      setNewAcc({ name: '', type: 'Cash', balance: 0 });
      fetchAccounts();
    } catch (e) {
      alert("Error saving account");
    }
  };

  const handleEdit = (acc: Account) => {
    setEditingAcc(acc);
    setNewAcc({ name: acc.name, type: acc.type, balance: acc.balance });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account? Transactions will not be deleted but balances might become inconsistent.")) return;
    try {
      await api.accounts.delete(id);
      fetchAccounts();
    } catch (e) {
      alert("Failed to delete account");
    }
  };

  if (loading && !showAdd && accounts.length === 0) return <div className="p-20 text-center animate-pulse">{t('loading')}...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold">{t('accounts')}</h2>
        <button 
          onClick={() => { setShowAdd(true); setEditingAcc(null); setNewAcc({ name: '', type: 'Cash', balance: 0 }); }}
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
            <h3 className="font-bold text-lg mb-4">{editingAcc ? 'Edit Account' : 'Add New Account'}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                autoFocus
                placeholder="Account Name (e.g. My Wallet, Personal bKash)"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                value={newAcc.name}
                onChange={e => setNewAcc({...newAcc, name: e.target.value})}
              />
              <div className="grid grid-cols-4 gap-2">
                {ACCOUNT_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewAcc({...newAcc, type})}
                    className={`p-2 rounded-lg font-bold text-[10px] truncate ${newAcc.type === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
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
                readOnly={!!editingAcc}
                onChange={e => setNewAcc({...newAcc, balance: Number(e.target.value)})}
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 p-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-bold">
                  {editingAcc ? 'Update' : 'Add Account'}
                </button>
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
            className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                <Icon name={acc.type === 'Cash' ? 'Wallet' : (['bKash', 'Nagad', 'Rocket', 'Upay'].includes(acc.type) ? 'Smartphone' : 'CreditCard')} size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">{acc.name}</h4>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{acc.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xl font-bold">৳ {acc.balance.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Balance</p>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => handleEdit(acc)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-indigo-600"><Icon name="Edit2" size={12} /></button>
                 <button onClick={() => handleDelete(acc.id.toString())} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-rose-500"><Icon name="Trash2" size={12} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AccountsList;
