import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

const LoansList: React.FC = () => {
  const { t } = useApp();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLoan, setNewLoan] = useState({ person: '', amount: 0, type: 'give', note: '' });

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await api.loans.list();
      setLoans(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.person || !newLoan.amount) return;
    await api.loans.create(newLoan);
    setShowAdd(false);
    setNewLoan({ person: '', amount: 0, type: 'give', note: '' });
    fetchLoans();
  };

  if (loading && !showAdd) return <div className="p-20 text-center animate-pulse">{t('loading')}...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold">{t('loans')} / দেনা-পাওনা</h2>
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
                placeholder="Person Name"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                value={newLoan.person}
                onChange={e => setNewLoan({...newLoan, person: e.target.value})}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewLoan({...newLoan, type: 'give'})}
                  className={`flex-1 p-3 rounded-xl font-bold text-xs ${newLoan.type === 'give' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}
                >
                  I Gave (পাবো)
                </button>
                <button
                  type="button"
                  onClick={() => setNewLoan({...newLoan, type: 'take'})}
                  className={`flex-1 p-3 rounded-xl font-bold text-xs ${newLoan.type === 'take' ? 'bg-rose-600 text-white' : 'bg-slate-100'}`}
                >
                  I Took (দেব)
                </button>
              </div>
              <input 
                type="number"
                placeholder="Amount"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none text-xl"
                value={newLoan.amount || ''}
                onChange={e => setNewLoan({...newLoan, amount: Number(e.target.value)})}
              />
              <textarea 
                placeholder="Note (optional)"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none resize-none"
                rows={2}
                value={newLoan.note}
                onChange={e => setNewLoan({...newLoan, note: e.target.value})}
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 p-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-bold">Save Loan</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Receivable</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">৳ {loans.filter(l => l.type === 'give').reduce((acc, current) => acc + current.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-3xl border border-rose-100 dark:border-rose-800">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Payable</p>
            <p className="text-xl font-black text-rose-700 dark:text-rose-400">৳ {loans.filter(l => l.type === 'take').reduce((acc, current) => acc + current.amount, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        {loans.map((loan) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${loan.type === 'give' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <Icon name={loan.type === 'give' ? 'ArrowUpRight' : 'ArrowDownLeft'} size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate">{loan.person}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{loan.note || 'No note'}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${loan.type === 'give' ? 'text-emerald-500' : 'text-rose-500'}`}>
                ৳ {loan.amount.toLocaleString()}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase mt-1 ${loan.status === 'paid' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'}`}>
                {loan.status || 'Pending'}
              </span>
            </div>
          </motion.div>
        ))}

        {loans.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic">
            No loan records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansList;
