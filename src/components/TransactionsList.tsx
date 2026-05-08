import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Transaction } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

const TransactionsList: React.FC = () => {
  const { t } = useApp();
  const { showToast } = useToast();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTxs = async () => {
    try {
      const data = await api.transactions.list();
      setTxs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      // Need a delete API in api.ts
      await api.transactions.delete(id);
      showToast("Transaction deleted", "success");
      fetchTxs();
    } catch (e) {
      showToast("Failed to delete", "error");
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">{t('loading')}...</div>;

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold px-2">{t('transactions')}</h2>
      
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
                
                <button 
                  onClick={() => handleDelete(tx.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {txs.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic">
            No transactions found yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsList;
