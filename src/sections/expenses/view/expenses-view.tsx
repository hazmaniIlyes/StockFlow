import type { Expense } from 'src/_mock/_data';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { useExpenses, useSettings, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { ExpensesTable } from '../expenses-table';
import { ExpensesKpiCards } from '../expenses-kpi-cards';
import { ExpensesFormDialog } from '../expenses-form-dialog';
import { ExpensesBreakdownChart } from '../expenses-breakdown-chart';

// ======================================================================

export function ExpensesView() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { expenseCategories } = useSettings();
  const { showSnackbar } = useSnackbar();
  const { t } = useTranslation();
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
      // Category is now stored as label directly (e.g., "Rent", "Utilities")
      const label = expenseCategories.find((c) => c.label === e.category)?.label ?? e.category;
      totals[label] = (totals[label] ?? 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, expenseCategories]);

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
        updateExpense(editExpense.id, data);
        showSnackbar(t('expenses.expenseUpdated'), 'success');
      } else {
        addExpense(data);
        showSnackbar(t('expenses.expenseAdded'), 'success');
      }
    },
    [editExpense, updateExpense, addExpense, showSnackbar, t]
  );

  const handleDelete = useCallback((expenseId: string) => {
    deleteExpense(expenseId);
    showSnackbar(t('expenses.expenseDeleted'), 'info');
  }, [deleteExpense, showSnackbar, t]);

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">{t('expenses.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleAdd}
        >
          {t('expenses.addExpense')}
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
            title={t('expenses.byCategory')}
            subheader={t('expenses.allTime')}
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
