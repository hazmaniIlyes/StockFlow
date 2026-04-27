import type { ReactNode } from 'react';
import type { Expense } from 'src/_mock/_data';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { isElectron, expensesDB } from 'src/services/db'; // Import database service for SQLite expense operations

// ======================================================================

type ExpensesContextType = {
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id'>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpense: (id: string) => Expense | undefined;
  clearAll: () => void;
};

const ExpensesContext = createContext<ExpensesContextType | null>(null);

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
}

type ProviderProps = {
  children: ReactNode;
};

export function ExpensesProvider({ children }: ProviderProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // ── Load expenses from SQLite on mount ─────────────────────────────
  // Replaces the old useState([]) with data fetched from the database on startup.
  useEffect(() => {
    if (isElectron()) {
      // Load all expenses from SQLite database when provider mounts
      expensesDB.getAll().then((dbExpenses) => {
        console.log('[ExpensesContext] Loaded expenses from SQLite:', dbExpenses.length);
        setExpenses(dbExpenses); // Populate React state with database data
      }).catch((err) => {
        window.appLog?.error('[ExpensesContext] Failed to load expenses from SQLite:', err);
      });
    }
  }, []); // Empty deps = run once on mount

  const getExpense = useCallback((id: string) => expenses.find((e) => e.id === id), [expenses]);

  const addExpense = useCallback((data: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`, // Generate unique expense ID using timestamp
      ...data,
    };

    // ── Persist new expense to SQLite ─────────────────────────────────
    if (isElectron()) {
      expensesDB.add(newExpense).catch((err) => {
        window.appLog?.error('[ExpensesContext] Failed to add expense to SQLite:', err);
      });
    }

    setExpenses((prev) => [newExpense, ...prev]); // Add to front — newest first
    return newExpense;
  }, []);

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    // ── Persist expense update to SQLite ──────────────────────────────
    if (isElectron()) {
      expensesDB.update(id, data).catch((err) => {
        window.appLog?.error('[ExpensesContext] Failed to update expense in SQLite:', err);
      });
    }

    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    // ── Delete expense from SQLite ───────────────────────────────────
    if (isElectron()) {
      expensesDB.delete(id).catch((err) => {
        window.appLog?.error('[ExpensesContext] Failed to delete expense from SQLite:', err);
      });
    }

    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    // ── Clear all expenses from SQLite ────────────────────────────────
    if (isElectron()) {
      expensesDB.clearAll().catch((err) => {
        window.appLog?.error('[ExpensesContext] Failed to clear all expenses from SQLite:', err);
      });
    }

    setExpenses([]);
  }, []);

  const value = useMemo(
    () => ({
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      getExpense,
      clearAll,
    }),
    [expenses, addExpense, updateExpense, deleteExpense, getExpense, clearAll]
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}
