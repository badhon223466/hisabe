import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DashboardData, Account, Transaction } from '../types';
import { Icon } from '../components/Icon';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC<{ onEdit?: (tx: Transaction) => void; onAdd?: () => void }> = ({ onEdit, onAdd }) => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<string>('all');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showCustom, setShowCustom] = useState(false);

  const fetchData = async (range: string, dates?: { start: string; end: string }) => {
    setLoading(true);
    try {
      const [dash, accs] = await Promise.all([
        api.dashboard.get(range, dates),
        api.accounts.list()
      ]);
      setData(dash);
      setAccounts(accs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'custom') {
      if (customDates.start && customDates.end) {
        fetchData('custom', customDates);
      }
    } else {
      fetchData(filter);
    }
  }, [filter, customDates]);

  if (loading && !data && accounts.length === 0) return <div className="flex items-center justify-center p-20 animate-pulse">{t('loading')}...</div>;

  const totalIncome = data?.stats.total_income || 0;
  const totalExpense = data?.stats.total_expense || 0;
  const actualTotalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const filters = [
    { id: 'today', label: t('today') },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: t('this_week') },
    { id: '30days', label: t('this_month') },
    { id: 'all', label: 'All' },
    { id: 'custom', label: 'Custom' }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Filters */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto scrollbar-hide no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id);
              if (f.id === 'custom') setShowCustom(true);
              else setShowCustom(false);
            }}
            className={`whitespace-nowrap px-4 py-2 text-[10px] font-bold rounded-xl transition-all ${
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
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-2 items-center"
        >
          <input 
            type="date" 
            className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold border-none"
            value={customDates.start}
            onChange={e => setCustomDates({...customDates, start: e.target.value})}
          />
          <span className="text-xs font-bold text-slate-400">To</span>
          <input 
            type="date" 
            className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold border-none"
            value={customDates.end}
            onChange={e => setCustomDates({...customDates, end: e.target.value})}
          />
        </motion.div>
      )}

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <p className="text-indigo-100 text-sm">{t('total_balance')}</p>
          <h2 className="text-4xl font-bold mt-1">৳ {actualTotalBalance.toLocaleString()}</h2>
          <div className="mt-6 flex justify-between items-center gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl">
              <p className="text-[10px] text-indigo-100 uppercase tracking-wider">{t('income')}</p>
              <p className="text-lg font-bold">৳ {totalIncome.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl">
              <p className="text-[10px] text-indigo-100 uppercase tracking-wider">{t('expense')}</p>
              <p className="text-lg font-bold">৳ {totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Account Quick Glance */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{t('accounts')}</h3>
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Live balance</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide no-scrollbar touch-pan-x">
            {accounts.map(acc => (
                <motion.div 
                    key={acc.id} 
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[150px] snap-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name={acc.type === 'Cash' ? 'Wallet' : 'CreditCard'} size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 truncate">{acc.name}</span>
                    </div>
                    <p className="text-sm font-black">৳ {acc.balance.toLocaleString()}</p>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{t('recent_transactions')}</h3>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-indigo-600 dark:text-indigo-400 text-xs font-bold"
          >
            {t('view_all')}
          </button>
        </div>
        <div className="space-y-3">
          {data?.recent.map((tx) => (
            <motion.div
              key={tx.id}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${tx.category_color}20`, color: tx.category_color }}
                >
                  <Icon name={tx.category_icon || 'Wallet'} size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{tx.category_name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.note || 'No note'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'income' ? '+' : '-'} ৳ {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
                </div>
                <button 
                   onClick={(e) => { e.stopPropagation(); onEdit?.(tx); }}
                   className="p-1.5 text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <Icon name="Edit2" size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Floating Action Button (Only on Dashboard) */}
      <button
        onClick={onAdd}
        className="fixed bottom-24 right-6 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center z-40 transition-transform active:scale-90"
      >
        <Icon name="Save" size={32} />
      </button>
    </div>
  );
};

export default Dashboard;
