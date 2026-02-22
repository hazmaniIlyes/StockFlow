import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { EXPENSE_CATEGORIES } from 'src/_mock/_data';
import type { Expense, ExpenseCategory } from 'src/_mock/_data';

// ======================================================================

type Props = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
};

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-year', label: 'This Year' },
];

function getCategoryColor(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.color ?? '#A29BFE';
}

function getCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function ExpensesTable({ expenses, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuExpense, setMenuExpense] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    let result = expenses;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          getCategoryLabel(e.category).toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      result = result.filter((e) => {
        const d = new Date(e.date);
        if (dateFilter === 'this-month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        if (dateFilter === 'last-month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        }
        if (dateFilter === 'this-year') return d.getFullYear() === currentYear;
        return true;
      });
    }

    return result;
  }, [expenses, search, categoryFilter, dateFilter]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, expense: Expense) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuExpense(expense);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuExpense(null);
  };

  return (
    <Card>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold-duotone" width={20} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {DATE_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Table */}
      <Scrollbar>
        <TableContainer sx={{ minWidth: 700 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Recurring</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No expenses found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(expense.date)}</TableCell>
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{expense.description}</Box>
                    {expense.note && (
                      <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                        {expense.note}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getCategoryLabel(expense.category)}
                      size="small"
                      sx={{
                        bgcolor: `${getCategoryColor(expense.category)}22`,
                        color: getCategoryColor(expense.category),
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ typography: 'subtitle2' }}>{fCurrency(expense.amount)}</Box>
                  </TableCell>
                  <TableCell align="center">
                    <Label
                      color={
                        expense.recurring === 'monthly'
                          ? 'info'
                          : expense.recurring === 'yearly'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {expense.recurring === 'one-time'
                        ? 'One-time'
                        : expense.recurring === 'monthly'
                          ? 'Monthly'
                          : 'Yearly'}
                    </Label>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => handleOpenMenu(e, expense)}>
                      <Iconify icon="solar:menu-dots-bold" width={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      {/* Kebab Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 180 } } }}
      >
        <MenuItem
          onClick={() => {
            if (menuExpense) onEdit(menuExpense);
            handleCloseMenu();
          }}
        >
          <ListItemIcon><Iconify icon="solar:pen-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuExpense) onDelete(menuExpense.id);
            handleCloseMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}
