import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { signInWithGoogle } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

const Auth: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { t } = useApp();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-xl">S</div>
          <h2 className="text-3xl font-bold">Smart Manager</h2>
          <p className="text-slate-400 mt-2">Manage your finances with AI insights</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[2rem] text-lg font-bold shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1z"/></svg>
            </div>
            {loading ? 'Logging in...' : 'Sign in with Google'}
          </button>
        </div>
        
        <p className="text-center mt-10 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Secure Cloud Storage Powered by Firebase
        </p>
      </motion.div>
    </div>
  );
};
export default Auth;
