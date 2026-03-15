import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Expense } from 'src/_mock/_data';

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

  const getExpense = useCallback((id: string) => expenses.find((e) => e.id === id), [expenses]);

  const addExpense = useCallback((data: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      ...data,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  }, []);

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => setExpenses([]), []);

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
