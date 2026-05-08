import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DashboardData, Account } from '../types';
import { Icon } from '../components/Icon';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { t } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dash, ai, accs] = await Promise.all([
          api.dashboard.get(),
          api.dashboard.getAIInsights(),
          api.accounts.list()
        ]);
        setData(dash);
        setInsights(ai);
        setAccounts(accs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-20 animate-pulse">{t('loading')}...</div>;

  const totalIncome = data?.stats.total_income || 0;
  const totalExpense = data?.stats.total_expense || 0;
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {accounts.map(acc => (
                <motion.div 
                    key={acc.id} 
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[140px] bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
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

      {/* AI Insights Slider */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{t('tips')}</h3>
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-bold uppercase tracking-widest">AI Power</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scroll-smooth snap-x snap-mandatory no-scrollbar touch-pan-x">
          {insights.map((tip, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="min-w-[260px] max-w-[280px] bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3 snap-center"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Icon name="Zap" size={20} className="text-amber-600" />
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{tip}</p>
            </motion.div>
          ))}
          {insights.length === 0 && !loading && (
            <div className="w-full py-8 text-center text-slate-400 text-xs italic">
                Tips generating...
            </div>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{t('recent_transactions')}</h3>
          <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">{t('view_all')}</button>
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
