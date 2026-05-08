import { db, auth } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { User, DashboardData, Transaction, Category, Account } from "../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
  auth: {
    // We will use Firebase Auth directly in the components, 
    // but these are placeholders if needed for custom logic
    getUser: () => auth.currentUser,
  },
  dashboard: {
    get: async (range: 'today' | '7days' | '30days' | 'all' = 'all'): Promise<DashboardData> => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Not authenticated");

      try {
        const cats = await api.categories.list();
        
        // Stats query - we still need to calculate stats based on range
        // For simplicity and to avoid complex index requirements right now, 
        // we'll fetch all and filter in memory or fetch with date where possible.
        let txQuery = query(collection(db, 'transactions'), where('userId', '==', userId));
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        let minDate = '';
        if (range === 'today') {
           minDate = now.toISOString().split('T')[0];
        } else if (range === '7days') {
           const d = new Date();
           d.setDate(d.getDate() - 7);
           minDate = d.toISOString().split('T')[0];
        } else if (range === '30days') {
           const d = new Date();
           d.setMonth(d.getMonth() - 1);
           minDate = d.toISOString().split('T')[0];
        }

        if (minDate) {
          txQuery = query(txQuery, where('date', '>=', minDate));
        }

        const txSnap = await getDocs(txQuery);
        let income = 0;
        let expense = 0;
        
        const allTxs = txSnap.docs.map(d => {
          const data = d.data();
          const cat = cats.find((c: Category) => c.id === data.categoryId);
          if (data.type === 'income') income += data.amount;
          else expense += data.amount;

          return { 
            id: d.id, 
            ...data,
            category_id: data.categoryId,
            account_id: data.accountId,
            category_name: cat?.name || 'General',
            category_icon: cat?.icon || 'Wallet',
            category_color: cat?.color || '#94a3b8'
          } as Transaction;
        });

        // Sort by date desc for "recent"
        const recent = [...allTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

        // Get loans info (loans don't usually filter by range in same way, but keeping it)
        const loanQuery = query(collection(db, 'loans'), where('userId', '==', userId));
        const loanSnap = await getDocs(loanQuery);
        let receivable = 0;
        let payable = 0;
        loanSnap.docs.forEach(d => {
          const data = d.data();
          if (data.type === 'give') receivable += data.amount;
          else payable += data.amount;
        });

        return {
          stats: { total_income: income, total_expense: expense },
          recent,
          loans: { money_receivable: receivable, money_payable: payable }
        };
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'dashboard');
        throw e;
      }
    },
    getAIInsights: async (): Promise<string[]> => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/ai/insights`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!res.ok) throw new Error("Server error");
        return await res.json();
      } catch (e) {
        console.error("Failed to fetch insights:", e);
        return [
          "আপনার খরচ ট্র্যাক করা চালিয়ে যান।",
          "অপ্রয়োজনীয় খরচ কমানোর চেষ্টা করুন।",
          "ভবিষ্যতের জন্য আপৎকালীন তহবিল তৈরি করুন।"
        ];
      }
    }
  },
  transactions: {
    list: async (range: 'today' | '7days' | '30days' | 'all' = 'all'): Promise<Transaction[]> => {
      const userId = auth.currentUser?.uid;
      try {
        let q = query(collection(db, 'transactions'), where('userId', '==', userId));
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        let minDate = '';
        if (range === 'today') {
           minDate = now.toISOString().split('T')[0];
        } else if (range === '7days') {
           const d = new Date();
           d.setDate(d.getDate() - 7);
           minDate = d.toISOString().split('T')[0];
        } else if (range === '30days') {
           const d = new Date();
           d.setMonth(d.getMonth() - 1);
           minDate = d.toISOString().split('T')[0];
        }

        if (minDate) {
          q = query(q, where('date', '>=', minDate));
        }
        
        // Sorting in client if complex where/orderBy combo hits index missing
        const snap = await getDocs(q);
        const cats = await api.categories.list();
        const txs = snap.docs.map(d => {
          const data = d.data();
          const cat = cats.find((c: Category) => c.id === data.categoryId);
          return { 
            id: d.id, 
            ...data,
            category_id: data.categoryId,
            account_id: data.accountId,
            category_name: cat?.name || 'General',
            category_icon: cat?.icon || 'Wallet',
            category_color: cat?.color || '#94a3b8'
          } as Transaction;
        });

        return txs.sort((a, b) => b.date.localeCompare(a.date));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'transactions');
        throw e;
      }
    },
    create: async (data: any) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");
      
      try {
        // 1. Create the transaction - use camelCase for Firestore
        const { category_id, account_id, ...rest } = data;
        const docRef = await addDoc(collection(db, 'transactions'), {
          ...rest,
          categoryId: category_id,
          accountId: account_id,
          userId,
          created_at: Timestamp.now()
        });

        // 2. Adjust Account Balance
        const accRef = doc(db, 'accounts', account_id);
        const accSnap = await getDoc(accRef);
        if (accSnap.exists()) {
          const currentBalance = accSnap.data().balance || 0;
          const adjustment = data.type === 'income' ? data.amount : -data.amount;
          await updateDoc(accRef, {
            balance: currentBalance + adjustment
          });
        }

        return { success: true, id: docRef.id };
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'transactions');
        throw e;
      }
    },
    delete: async (id: string) => {
      try {
        const docRef = doc(db, 'transactions', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
           const data = snap.data();
           const accRef = doc(db, 'accounts', data.accountId);
           const accSnap = await getDoc(accRef);
           if (accSnap.exists()) {
             // Reverse the balance adjustment
             const currentBalance = accSnap.data().balance || 0;
             const adjustment = data.type === 'income' ? -data.amount : data.amount;
             await updateDoc(accRef, { balance: currentBalance + adjustment });
           }
        }
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'transactions');
        throw e;
      }
    }
  },
  accounts: {
    list: async (): Promise<Account[]> => {
      const userId = auth.currentUser?.uid;
      try {
        const q = query(collection(db, 'accounts'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const accs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any;

        if (accs.length === 0) {
            // Updated account list with more icons/types as requested
            const defaultAccs = [
              { name: 'Cash', type: 'Cash', balance: 0, userId },
              { name: 'bKash', type: 'bKash', balance: 0, userId },
              { name: 'Nagad', type: 'Nagad', balance: 0, userId }
            ];
            for (const acc of defaultAccs) {
              await addDoc(collection(db, 'accounts'), acc);
            }
            return (await api.accounts.list());
        }
        return accs;
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'accounts');
        throw e;
      }
    },
    create: async (data: any) => {
      const userId = auth.currentUser?.uid;
      try {
        await addDoc(collection(db, 'accounts'), { ...data, userId });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'accounts');
        throw e;
      }
    }
  },
  loans: {
    list: async (): Promise<any[]> => {
      const userId = auth.currentUser?.uid;
      try {
        const q = query(collection(db, 'loans'), where('userId', '==', userId), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => {
          const data = d.data();
          return { id: d.id, ...data, person: data.personName || data.person };
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'loans');
        throw e;
      }
    },
    create: async (data: any) => {
      const userId = auth.currentUser?.uid;
      try {
        // Match personName from rules
        const { person, ...rest } = data;
        await addDoc(collection(db, 'loans'), {
          ...rest,
          personName: person,
          userId,
          created_at: Timestamp.now(),
          status: 'pending'
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'loans');
        throw e;
      }
    },
    addPayment: async (loanId: string, amount: number) => {
      try {
        await addDoc(collection(db, `loans/${loanId}/payments`), {
          amount,
          date: new Date().toISOString().split('T')[0],
          created_at: Timestamp.now()
        });
        // Update loan status if needed (complex logic could go here)
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'loan_payments');
      }
    }
  },
  categories: {
    list: async (): Promise<Category[]> => {
      const userId = auth.currentUser?.uid;
      try {
        const q = query(collection(db, 'categories'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const cats = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any;
        
        // Default categories if none exist
        if (cats.length === 0) {
            const defaults = [
                { name: 'Food', type: 'expense', icon: 'Utensils', color: '#F43F5E' },
                { name: 'Transport', type: 'expense', icon: 'Bus', color: '#3B82F6' },
                { name: 'Salary', type: 'income', icon: 'Wallet', color: '#10B981' },
                { name: 'Entertainment', type: 'expense', icon: 'Gamepad2', color: '#8B5CF6' },
                { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
                { name: 'Medical', type: 'expense', icon: 'Stethoscope', color: '#EF4444' }
            ];
            for (const cat of defaults) {
                await addDoc(collection(db, 'categories'), { ...cat, userId });
            }
            return (await api.categories.list());
        }
        return cats;
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'categories');
        throw e;
      }
    },
  },
  seed: {
    data: async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      try {
        const [cats, accs] = await Promise.all([
          api.categories.list(),
          api.accounts.list()
        ]);

        const foodCat = cats.find(c => c.name === 'Food') || cats[0];
        const salaryCat = cats.find(c => c.name === 'Salary') || cats[0];
        const transportCat = cats.find(c => c.name === 'Transport') || cats[0];
        const mainAcc = accs[0];

        const samples = [
          { amount: 50000, type: 'income', categoryId: salaryCat.id, note: 'Monthly Salary', date: '2026-05-01' },
          { amount: 1500, type: 'expense', categoryId: foodCat.id, note: 'Lunch with friends', date: '2026-05-02' },
          { amount: 200, type: 'expense', categoryId: transportCat.id, note: 'Bus fare', date: '2026-05-02' },
          { amount: 5000, type: 'income', categoryId: salaryCat.id, note: 'Freelance Bonus', date: '2026-05-03' },
          { amount: 1200, type: 'expense', categoryId: foodCat.id, note: 'Dinner', date: '2026-05-04' },
          { amount: 300, type: 'expense', categoryId: transportCat.id, note: 'Rickshaw fare', date: '2026-05-05' },
          { amount: 2500, type: 'expense', categoryId: foodCat.id, note: 'Grocery shopping', date: '2026-05-06' },
          { amount: 1000, type: 'expense', categoryId: foodCat.id, note: 'Snacks', date: '2026-05-07' },
        ];

        for (const s of samples) {
          await addDoc(collection(db, 'transactions'), {
            ...s,
            userId,
            accountId: mainAcc.id,
            created_at: Timestamp.now()
          });
        }
        return { success: true };
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'seed');
        throw e;
      }
    }
  }
};
