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
    get: async (range: string = 'all', customDates?: { start: string; end: string }): Promise<DashboardData> => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Not authenticated");

      try {
        const cats = await api.categories.list();
        
        let txQuery = query(collection(db, 'transactions'), where('userId', '==', userId));
        
        const getBDDate = (date: Date) => {
          return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(date);
        };
        
        const now = new Date();
        const bdToday = getBDDate(now);
        
        let minDate = '';
        let maxDate = '';

        if (range === 'today') {
           minDate = bdToday;
        } else if (range === 'yesterday') {
           const y = new Date(now);
           y.setDate(y.getDate() - 1);
           minDate = getBDDate(y);
           maxDate = minDate;
        } else if (range === '7days') {
           const d = new Date(now);
           d.setDate(d.getDate() - 7);
           minDate = getBDDate(d);
        } else if (range === '30days') {
           const d = new Date(now);
           d.setMonth(d.getMonth() - 1);
           minDate = getBDDate(d);
        } else if (range === 'custom' && customDates) {
           minDate = customDates.start;
           maxDate = customDates.end;
        }

        if (minDate) {
          txQuery = query(txQuery, where('date', '>=', minDate));
        }
        if (maxDate) {
          txQuery = query(txQuery, where('date', '<=', maxDate));
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

        // Filter out transactions that might be outside maxDate if server query wasn't combined perfectly
        const filteredTxs = maxDate ? allTxs.filter(t => t.date <= maxDate) : allTxs;

        // Reset totals based on filtered results
        income = 0;
        expense = 0;
        filteredTxs.forEach(t => {
          if (t.type === 'income') income += t.amount;
          else expense += t.amount;
        });

        const recent = [...filteredTxs].sort((a, b) => {
          // Sort by date primary, then created_at secondary for stability
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          return (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0);
        }).slice(0, 5);

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
    list: async (range: string = 'all', customDates?: { start: string; end: string }): Promise<Transaction[]> => {
      const userId = auth.currentUser?.uid;
      try {
        let q = query(collection(db, 'transactions'), where('userId', '==', userId));
        
        const getBDDate = (date: Date) => {
          return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(date);
        };
        
        const now = new Date();
        const bdToday = getBDDate(now);
        
        let minDate = '';
        let maxDate = '';

        if (range === 'today') {
           minDate = bdToday;
        } else if (range === 'yesterday') {
           const y = new Date(now);
           y.setDate(y.getDate() - 1);
           minDate = getBDDate(y);
           maxDate = minDate;
        } else if (range === '7days') {
           const d = new Date(now);
           d.setDate(d.getDate() - 7);
           minDate = getBDDate(d);
        } else if (range === '30days') {
           const d = new Date(now);
           d.setMonth(d.getMonth() - 1);
           minDate = getBDDate(d);
        } else if (range === 'custom' && customDates) {
           minDate = customDates.start;
           maxDate = customDates.end;
        }

        if (minDate) {
          q = query(q, where('date', '>=', minDate));
        }
        if (maxDate) {
          q = query(q, where('date', '<=', maxDate));
        }
        
        // Fetch all candidates
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

        // Filter and Sort in client
        const filtered = maxDate ? txs.filter(t => t.date <= maxDate) : txs;

        return filtered.sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          return (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0);
        });
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
    update: async (id: string, data: any) => {
      try {
        const docRef = doc(db, 'transactions', id);
        const oldSnap = await getDoc(docRef);
        if (!oldSnap.exists()) throw new Error("Transaction not found");
        
        const oldData = oldSnap.data();
        const { category_id, account_id, ...rest } = data;

        // 1. Reverse old balance impact
        const oldAccRef = doc(db, 'accounts', oldData.accountId);
        const oldAccSnap = await getDoc(oldAccRef);
        if (oldAccSnap.exists()) {
           const balance = oldAccSnap.data().balance || 0;
           const reversal = oldData.type === 'income' ? -oldData.amount : oldData.amount;
           await updateDoc(oldAccRef, { balance: balance + reversal });
        }

        // 2. Apply new balance impact (might be same account or different)
        const newAccRef = doc(db, 'accounts', account_id);
        const newAccSnap = await getDoc(newAccRef);
        if (newAccSnap.exists()) {
           const balance = newAccSnap.data().balance || 0;
           const impact = data.type === 'income' ? data.amount : -data.amount;
           await updateDoc(newAccRef, { balance: balance + impact });
        }

        // 3. Update the transaction
        await updateDoc(docRef, {
          ...rest,
          categoryId: category_id,
          accountId: account_id,
          updated_at: Timestamp.now()
        });

      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'transactions');
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
    delete: async (id: string) => {
      try {
        const docRef = doc(db, 'accounts', id);
        // Maybe check if account has transactions first? 
        // For now just delete.
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'accounts');
        throw e;
      }
    },
    update: async (id: string, data: any) => {
      try {
        const docRef = doc(db, 'accounts', id);
        await updateDoc(docRef, data);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'accounts');
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
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'loans', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'loans');
        throw e;
      }
    },
    update: async (id: string, data: any) => {
      try {
        await updateDoc(doc(db, 'loans', id), data);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'loans');
        throw e;
      }
    },
    repay: async (loanId: string, amount: number, accountId: string, note?: string) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Not authenticated");
      
      try {
        const loanRef = doc(db, 'loans', loanId);
        const loanSnap = await getDoc(loanRef);
        if (!loanSnap.exists()) throw new Error("Loan not found");
        
        const loanData = loanSnap.data();
        const remaining = loanData.amount - (loanData.paidAmount || 0);
        const newPaidAmount = (loanData.paidAmount || 0) + amount;
        
        // 1. Update loan
        await updateDoc(loanRef, {
          paidAmount: newPaidAmount,
          status: newPaidAmount >= loanData.amount ? 'completed' : 'pending'
        });

        // 2. Create transaction record
        // If we GAVE money (loanData.type === 'give'), then receiving it back is INcome
        // If we TOOK money (loanData.type === 'take'), then paying it back is EXpense
        const txType = loanData.type === 'give' ? 'income' : 'expense';
        
        const cats = await api.categories.list();
        // Look for a 'Loan Repayment' category or use 'General'
        let catId = cats.find(c => c.name.toLowerCase().includes('loan'))?.id || cats[0].id;

        await api.transactions.create({
          type: txType,
          amount,
          category_id: catId,
          note: note || `Loan repayment from ${loanData.personName}`,
          date: new Date().toISOString().split('T')[0],
          account_id: accountId
        });

        return { success: true };
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'loans/repay');
        throw e;
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
    create: async (data: any) => {
      const userId = auth.currentUser?.uid;
      try {
        await addDoc(collection(db, 'categories'), { ...data, userId });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'categories');
        throw e;
      }
    },
    update: async (id: string, data: any) => {
      try {
        await updateDoc(doc(db, 'categories', id), data);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'categories');
        throw e;
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'categories');
        throw e;
      }
    }
  }
};
