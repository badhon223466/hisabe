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

  const [filter, setFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');

  const fetchTxs = async (range: any) => {
    setLoading(true);
    try {
      const data = await api.transactions.list(range);
      setTxs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTxs(filter);
  }, [filter]);

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this transaction? Balance will be adjusted.")) return;
    try {
      await api.transactions.delete(id.toString());
      showToast("Transaction deleted", "success");
      fetchTxs(filter);
    } catch (e) {
      showToast("Failed to delete", "error");
    }
  };

  const filters = [
    { id: 'today', label: t('today') },
    { id: '7days', label: t('this_week') },
    { id: '30days', label: t('this_month') },
    { id: 'all', label: 'All' }
  ];

  if (loading && txs.length === 0) return <div className="p-20 text-center animate-pulse">{t('loading')}...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="px-2 space-y-4">
        <h2 className="text-2xl font-bold">{t('transactions')}</h2>
        
        {/* Filters */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`flex-1 py-1.5 text-[9px] font-black rounded-lg transition-all ${
                filter === f.id 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
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
