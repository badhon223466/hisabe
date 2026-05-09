import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Transaction } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

const TransactionsList: React.FC<{ onEdit?: (tx: Transaction) => void }> = ({ onEdit }) => {
  const { t } = useApp();
  const { showToast } = useToast();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<string>('all');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showCustom, setShowCustom] = useState(false);

  const fetchTxs = async (range: string, dates?: { start: string; end: string }) => {
    setLoading(true);
    try {
      const data = await api.transactions.list(range, dates);
      setTxs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (filter === 'custom') {
      if (customDates.start && customDates.end) {
        fetchTxs('custom', customDates);
      }
    } else {
      fetchTxs(filter);
    }
  }, [filter, customDates]);

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure? Balance will be adjusted.")) return;
    try {
      await api.transactions.delete(id.toString());
      showToast("Deleted", "success");
      fetchTxs(filter, filter === 'custom' ? customDates : undefined);
    } catch (e) {
      showToast("Failed", "error");
    }
  };

  const filters = [
    { id: 'today', label: t('today') },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: t('this_week') },
    { id: '30days', label: t('this_month') },
    { id: 'all', label: 'All' },
    { id: 'custom', label: 'Custom' }
  ];

  const totalIncome = txs.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc, 0);
  const totalExpense = txs.reduce((acc, tx) => tx.type === 'expense' ? acc + tx.amount : acc, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6 pb-20">
      <div className="px-2 space-y-4">
        <h2 className="text-2xl font-bold">{t('transactions')}</h2>
        
        {/* Summary Dashboard for Transactions Page */}
        <div className="grid grid-cols-3 gap-2">
           <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-center">
              <p className="text-[8px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Income</p>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">৳{totalIncome.toLocaleString()}</p>
           </div>
           <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/50 text-center">
              <p className="text-[8px] uppercase font-bold text-rose-600 dark:text-rose-400 mb-1">Expense</p>
              <p className="text-sm font-black text-rose-700 dark:text-rose-300">৳{totalExpense.toLocaleString()}</p>
           </div>
           <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center">
              <p className="text-[8px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1">Difference</p>
              <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">৳{netBalance.toLocaleString()}</p>
           </div>
        </div>

        {/* Filters */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setShowCustom(f.id === 'custom');
              }}
              className={`whitespace-nowrap px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${
                filter === f.id 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showCustom && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <input 
              type="date" 
              className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-[10px] font-bold outline-none"
              value={customDates.start}
              onChange={e => setCustomDates({...customDates, start: e.target.value})}
            />
            <span className="text-[10px] font-bold text-slate-400">to</span>
            <input 
              type="date" 
              className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-[10px] font-bold outline-none"
              value={customDates.end}
              onChange={e => setCustomDates({...customDates, end: e.target.value})}
            />
          </motion.div>
        )}
      </div>
      
      <div className="space-y-3">
        <AnimatePresence>
          {txs.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tx.category_color}20`, color: tx.category_color }}
                >
                  <Icon name={tx.category_icon || 'Wallet'} size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{tx.category_name || 'General'}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{tx.note || 'No note'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'income' ? '+' : '-'} ৳ {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
                </div>
                
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => onEdit?.(tx)}
                    className="p-1 text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  >
                    <Icon name="Edit2" size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(tx.id)}
                    className="p-1 text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {txs.length === 0 && !loading && (
          <div className="p-20 text-center text-slate-400 italic">
            No transactions found yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsList;
