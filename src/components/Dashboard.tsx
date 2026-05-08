import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DashboardData, Account } from '../types';
import { Icon } from '../components/Icon';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');

  const fetchData = async (range: any) => {
    setLoading(true);
    try {
      const [dash, accs] = await Promise.all([
        api.dashboard.get(range),
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
    fetchData(filter);
  }, [filter]);

  if (loading && !data) return <div className="flex items-center justify-center p-20 animate-pulse">{t('loading')}...</div>;

  const totalIncome = data?.stats.total_income || 0;
  const totalExpense = data?.stats.total_expense || 0;
  const balance = totalIncome - totalExpense;

  const filters = [
    { id: 'today', label: t('today') },
    { id: '7days', label: t('this_week') },
    { id: '30days', label: t('this_month') },
    { id: 'all', label: 'All' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${
              filter === f.id 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <p className="text-indigo-100 text-sm">{t('total_balance')}</p>
          <h2 className="text-4xl font-bold mt-1">৳ {balance.toLocaleString()}</h2>
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
              <div className="text-right">
                <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {tx.type === 'income' ? '+' : '-'} ৳ {tx.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
