import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'bn' | 'en';
type Theme = 'light' | 'dark';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    transactions: 'লেনদেন',
    accounts: 'অ্যাকাউন্ট',
    loans: 'ঋণ ও পাওনা',
    reports: 'রিপোর্ট',
    settings: 'সেটিংস',
    total_balance: 'মোট ব্যালেন্স',
    income: 'আয়',
    expense: 'ব্যয়',
    savings: 'সঞ্চয়',
    recent_transactions: 'সাম্প্রতিক লেনদেন',
    give: 'পাওনা',
    take: 'দেনা',
    add_income: 'আয় যোগ করুন',
    add_expense: 'ব্যয় যোগ করুন',
    categories: 'ক্যাটাগরি',
    amount: 'পরিমাণ',
    note: 'নোট',
    date: 'তারিখ',
    save: 'সংরক্ষণ করুন',
    login: 'লগইন',
    register: 'রেজিস্ট্রেশন',
    tips: 'এআই পরামর্শ',
  },
  en: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    accounts: 'Accounts',
    loans: 'Loans',
    reports: 'Reports',
    settings: 'Settings',
    total_balance: 'Total Balance',
    income: 'Income',
    expense: 'Expense',
    savings: 'Savings',
    recent_transactions: 'Recent Transactions',
    give: 'Receivable',
    take: 'Payable',
    add_income: 'Add Income',
    add_expense: 'Add Expense',
    categories: 'Categories',
    amount: 'Amount',
    note: 'Note',
    date: 'Date',
    save: 'Save',
    login: 'Login',
    register: 'Register',
    tips: 'AI Insights',
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('bn');
  const [theme, setTheme] = useState<Theme>('light');

  const t = (key: string) => translations[language][key] || key;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      <div className={theme}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
