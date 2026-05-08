import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import AddTransaction from './components/AddTransaction';
import TransactionsList from './components/TransactionsList';
import AccountsList from './components/AccountsList';
import LoansList from './components/LoansList';
import SettingsPage from './components/SettingsPage';
import { Icon } from './components/Icon';
import { AnimatePresence } from 'framer-motion';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setEditingTx(null);
    triggerRefresh();
    showToast("Transaction saved successfully!", "success");
  };

  const openAdd = () => {
    setEditingTx(null);
    setShowAddModal(true);
  };

  const openEdit = (tx: any) => {
    setEditingTx(tx);
    setShowAddModal(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-bold text-indigo-600">Loading...</div>;
  if (!user) return <Auth onSuccess={() => {}} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard key={refreshTrigger} onEdit={openEdit} onAdd={openAdd} />} />
          <Route path="/transactions" element={<TransactionsList key={refreshTrigger} onEdit={openEdit} />} />
          <Route path="/accounts" element={<AccountsList key={refreshTrigger} />} />
          <Route path="/loans" element={<LoansList key={refreshTrigger} />} />
          <Route path="/settings" element={<SettingsPage onLogout={() => { signOut(auth); }} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>

      <AnimatePresence>
        {showAddModal && (
          <AddTransaction 
            onClose={() => { setShowAddModal(false); setEditingTx(null); }}
            onSuccess={handleAddSuccess}
            editingTransaction={editingTx}
          />
        )}
      </AnimatePresence>
    </BrowserRouter>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </AppProvider>
);

export default App;
