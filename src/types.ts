export interface User {
  id: string | number;
  name: string;
  email: string;
  language: 'bn' | 'en';
  theme: 'light' | 'dark';
}

export interface Category {
  id: string | number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Account {
  id: string | number;
  name: string;
  type: string;
  balance: number;
}

export interface Transaction {
  id: string | number;
  type: 'income' | 'expense';
  amount: number;
  category_id: string | number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  note: string;
  date: string;
  account_id: string | number;
}

export interface DashboardData {
  stats: {
    total_income: number;
    total_expense: number;
  };
  recent: Transaction[];
  loans: {
    money_receivable: number;
    money_payable: number;
  };
}

export const CATEGORY_ICONS: Record<string, string> = {
  Wallet: 'wallet',
  Laptop: 'laptop',
  Utensils: 'utensils',
  ShoppingBag: 'shopping-bag',
  Bus: 'bus',
  Heart: 'heart',
  Phone: 'phone',
  Zap: 'zap',
  Home: 'home',
  GraduationCap: 'graduation-cap',
};
