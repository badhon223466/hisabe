import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

const LoansList: React.FC = () => {
  const { t } = useApp();
  const [loans, setLoans] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const [newLoan, setNewLoan] = useState({ person: '', amount: 0, type: 'give', note: '' });
  
  const [showRepay, setShowRepay] = useState<string | null>(null);
  const [repayData, setRepayData] = useState({ amount: 0, accountId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loanData, accData] = await Promise.all([
        api.loans.list(),
        api.accounts.list()
      ]);
      setLoans(loanData);
      setAccounts(accData);
      if (accData.length > 0) setRepayData(prev => ({ ...prev, accountId: accData[0].id }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.person || !newLoan.amount) return;
    if (editingLoan) {
      await api.loans.update(editingLoan.id, newLoan);
    } else {
      await api.loans.create(newLoan);
    }
    setShowAdd(false);
    setEditingLoan(null);
    setNewLoan({ person: '', amount: 0, type: 'give', note: '' });
    fetchData();
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRepay || !repayData.amount || !repayData.accountId) return;
    try {
      await api.loans.repay(showRepay, repayData.amount, repayData.accountId);
      setShowRepay(null);
      setRepayData({ amount: 0, accountId: accounts[0]?.id || '' });
      fetchData();
    } catch (e) {
      alert("Failed to process payment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this loan record?")) return;
    try {
      await api.loans.delete(id);
      fetchData();
    } catch (e) {
      alert("Failed to delete");
    }
  };

  const handleEdit = (loan: any) => {
    setEditingLoan(loan);
    setNewLoan({ person: loan.person, amount: loan.amount, type: loan.type, note: loan.note });
    setShowAdd(true);
  };

  if (loading && !showAdd && loans.length === 0) return <div className="p-20 text-center animate-pulse">{t('loading')}...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold">{t('loans')} / দেনা-পাওনা</h2>
        <button 
          onClick={() => { setShowAdd(true); setEditingLoan(null); setNewLoan({ person: '', amount: 0, type: 'give', note: '' }); }}
          className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100"
        >
          <Icon name="Plus" size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900 shadow-xl"
          >
            <h3 className="font-bold text-lg mb-4">{editingLoan ? 'Edit Loan' : 'Add New Record'}</h3>
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
                  className={`flex-1 p-3 rounded-xl font-bold text-xs ${newLoan.type === 'give' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  I Gave (পাবো)
                </button>
                <button
                  type="button"
                  onClick={() => setNewLoan({...newLoan, type: 'take'})}
                  className={`flex-1 p-3 rounded-xl font-bold text-xs ${newLoan.type === 'take' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
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
                <button type="submit" className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-bold">
                  {editingLoan ? 'Update' : 'Save Loan'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {showRepay && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-[2rem] space-y-4"
            >
              <h3 className="font-bold text-xl">Process Collection/Payment</h3>
              <form onSubmit={handleRepay} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Amount</label>
                  <input 
                    type="number"
                    required
                    autoFocus
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none text-2xl"
                    value={repayData.amount || ''}
                    onChange={e => setRepayData({...repayData, amount: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Account</label>
                  <select 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none appearance-none"
                    value={repayData.accountId}
                    onChange={e => setRepayData({...repayData, accountId: e.target.value})}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (৳{acc.balance})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                   <button type="button" onClick={() => setShowRepay(null)} className="flex-1 p-4 font-bold text-slate-400">Cancel</button>
                   <button type="submit" className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">Submit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Receivable</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
               ৳ {loans.filter(l => l.type === 'give').reduce((acc, current) => acc + (current.amount - (current.paidAmount || 0)), 0).toLocaleString()}
            </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-3xl border border-rose-100 dark:border-rose-800">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Payable</p>
            <p className="text-xl font-black text-rose-700 dark:text-rose-400">
               ৳ {loans.filter(l => l.type === 'take').reduce((acc, current) => acc + (current.amount - (current.paidAmount || 0)), 0).toLocaleString()}
            </p>
        </div>
      </div>

      <div className="space-y-3">
        {loans.map((loan) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${loan.type === 'give' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <Icon name={loan.type === 'give' ? 'ArrowUpRight' : 'ArrowDownLeft'} size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{loan.person}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{loan.note || 'No note'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => handleDelete(loan.id)} className="p-1 text-rose-500"><Icon name="Trash2" size={14} /></button>
                 <button onClick={() => handleEdit(loan)} className="p-1 text-indigo-600"><Icon name="Edit2" size={14} /></button>
                 <div className="text-right">
                    <p className={`font-bold text-sm ${loan.type === 'give' ? 'text-emerald-500' : 'text-rose-500'}`}>৳ {loan.amount.toLocaleString()}</p>
                    <p className="text-[8px] text-slate-400 uppercase font-bold">Total</p>
                 </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
               <div 
                 className={`absolute inset-y-0 left-0 transition-all duration-500 ${loan.type === 'give' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                 style={{ width: `${Math.min(100, ((loan.paidAmount || 0) / loan.amount) * 100)}%` }}
               />
            </div>

            <div className="flex items-center justify-between mt-2">
               <div className="text-[10px] font-bold text-slate-500">
                  Paid: <span className="text-slate-900 dark:text-slate-200">৳ {(loan.paidAmount || 0).toLocaleString()}</span>
               </div>
               {loan.status !== 'completed' ? (
                 <button 
                  onClick={() => setShowRepay(loan.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                    loan.type === 'give' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                 >
                  Add Payment
                 </button>
               ) : (
                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Paid Fully</span>
               )}
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
