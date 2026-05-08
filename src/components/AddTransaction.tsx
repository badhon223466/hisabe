import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Category, Account } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

const AddTransaction: React.FC<{ 
  onClose: () => void; 
  onSuccess: () => void;
  editingTransaction?: any;
}> = ({ onClose, onSuccess, editingTransaction }) => {
  const { t } = useApp();
  const [type, setType] = useState<'income' | 'expense'>(editingTransaction?.type || 'expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    amount: editingTransaction?.amount?.toString() || '',
    category_id: editingTransaction?.category_id?.toString() || '',
    account_id: editingTransaction?.account_id?.toString() || '',
    note: editingTransaction?.note || '',
    date: editingTransaction?.date || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [cats, accs] = await Promise.all([
          api.categories.list(),
          api.accounts.list()
        ]);
        setCategories(cats);
        setAccounts(accs);
        
        if (!editingTransaction && accs.length > 0) {
          setFormData(prev => ({ ...prev, account_id: accs[0].id.toString() }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, [editingTransaction]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category_id || !formData.account_id) return;

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        account_id: formData.account_id,
        type,
      };

      if (editingTransaction) {
        await api.transactions.update(editingTransaction.id.toString(), payload);
      } else {
        await api.transactions.create(payload);
      }
      onSuccess();
    } catch (e) {
      alert('Failed to save transaction');
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 p-6"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          {editingTransaction ? t('edit') : t(type === 'income' ? 'add_income' : 'add_expense')}
        </h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          <Icon name="X" size={24} />
        </button>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 mb-8">
        <button
          onClick={() => setType('expense')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-800 shadow-sm text-rose-500' : 'text-slate-500'}`}
        >
          {t('expense')}
        </button>
        <button
          onClick={() => setType('income')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'income' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-500' : 'text-slate-500'}`}
        >
          {t('income')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t('amount')}</label>
          <div className="flex items-center gap-3 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-4xl font-bold mb-1">৳</span>
            <input
              type="number"
              placeholder="0.00"
              className="w-full text-4xl font-bold bg-transparent focus:outline-none"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">{t('categories')}</label>
          <div className="grid grid-cols-3 gap-4">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category_id: cat.id.toString() })}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  formData.category_id === cat.id.toString() 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-transparent bg-slate-50 dark:bg-slate-900'
                }`}
              >
                <div style={{ color: cat.color }}>
                  <Icon name={cat.icon} size={24} />
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t('accounts')}</label>
            <select
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold focus:outline-none"
              value={formData.account_id}
              onChange={e => setFormData({ ...formData, account_id: e.target.value })}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (৳{acc.balance})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t('date')}</label>
            <input
              type="date"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold focus:outline-none"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t('note')}</label>
          <textarea
            className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold focus:outline-none min-h-[100px]"
            placeholder={t('note')}
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className={`w-full py-5 rounded-[2rem] text-white text-xl font-bold shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-3 ${
            type === 'income' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'
          }`}
        >
          <Icon name="Save" size={24} />
          {t('save')}
        </button>
      </form>
    </motion.div>
  );
};

export default AddTransaction;
