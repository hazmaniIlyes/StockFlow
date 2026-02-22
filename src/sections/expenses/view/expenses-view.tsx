import { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { _expenses } from 'src/_mock';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { ExpensesKpiCards } from '../expenses-kpi-cards';
import { ExpensesTable } from '../expenses-table';
import { ExpensesFormDialog } from '../expenses-form-dialog';
import { ExpensesBreakdownChart } from '../expenses-breakdown-chart';

import { EXPENSE_CATEGORIES } from 'src/_mock/_data';
import type { Expense } from 'src/_mock/_data';

// ======================================================================

export function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>(_expenses);
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  // KPI calculations
  const kpis = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    let yearTotal = 0;

    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === currentYear) {
        yearTotal += e.amount;
        if (d.getMonth() === currentMonth) thisMonthTotal += e.amount;
      }
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        lastMonthTotal += e.amount;
      }
    });

    return { thisMonthTotal, lastMonthTotal, yearTotal };
  }, [expenses]);

  // Breakdown by category
  const breakdownData = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      const label = EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category;
      totals[label] = (totals[label] ?? 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const handleAdd = () => {
    setEditExpense(null);
    setFormOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    setFormOpen(true);
  };

  const handleFormSubmit = useCallback(
    (data: Omit<Expense, 'id'>) => {
      if (editExpense) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === editExpense.id ? { ...e, ...data } : e))
        );
      } else {
        const newExpense: Expense = { id: `exp-${Date.now()}`, ...data };
        setExpenses((prev) => [newExpense, ...prev]);
      }
    },
    [editExpense]
  );

  const handleDelete = useCallback((expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Expenses</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleAdd}
        >
          Add Expense
        </Button>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ mb: 3 }}>
        <ExpensesKpiCards
          thisMonth={kpis.thisMonthTotal}
          lastMonth={kpis.lastMonthTotal}
          yearTotal={kpis.yearTotal}
        />
      </Box>

      {/* Table + Chart */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ExpensesTable
            expenses={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <ExpensesBreakdownChart
            title="Expenses by Category"
            subheader="All time"
            chart={{ series: breakdownData }}
          />
        </Grid>
      </Grid>

      {/* Form Dialog */}
      {formOpen && (
        <ExpensesFormDialog
          open={formOpen}
          expense={editExpense}
          onClose={() => {
            setFormOpen(false);
            setEditExpense(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </DashboardContent>
  );
}
