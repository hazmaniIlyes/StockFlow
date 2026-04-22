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
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { useSettings, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { ExportButtons } from 'src/components/export-buttons';

import type { Expense } from 'src/_mock/_data';

// ======================================================================

type Props = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
};

export function ExpensesTable({ expenses, onEdit, onDelete }: Props) {
  const { expenseCategories } = useSettings();
  const { t, dir, language } = useTranslation();
  const numLocale = language === 'ar' ? 'ar-DZ' : 'fr-DZ';
  const fmtCurrency = (v: any) => `${Number(v).toLocaleString(numLocale)} ${language === 'ar' ? 'دج' : 'DA'}`;

  const DATE_FILTER_OPTIONS = [
    { value: 'all', label: t('expenses.allTime') },
    { value: 'this-month', label: t('expenses.thisMonth') },
    { value: 'last-month', label: t('expenses.lastMonth') },
    { value: 'this-year', label: t('expenses.thisYear') },
  ];
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuExpense, setMenuExpense] = useState<Expense | null>(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  // Helper functions to get category info from settings
  const getCategoryColor = (category: string): string => 
    expenseCategories.find((c) => c.label === category)?.color ?? '#A29BFE';

  const getCategoryLabel = (category: string): string => 
    expenseCategories.find((c) => c.label === category)?.label ?? category;

  const categoryOptions = useMemo(() => [
    { value: 'all', label: t('expenses.allCategories') },
    ...expenseCategories.map((c) => ({ value: c.label, label: c.label })),
  ], [expenseCategories, t]);

  // categoryLabelMap removed — category is no longer part of the search bar filter;
  // category filtering is handled exclusively by the dropdown filter below.

  const filtered = useMemo(() => {
    let result = expenses;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.description.toLowerCase().includes(q) // search by description only; category is filtered via the dropdown
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(0); };
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => { setCategoryFilter(e.target.value); setPage(0); };
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { setDateFilter(e.target.value); setPage(0); };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
    <Card sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '100%' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('expenses.searchExpenses')}
          value={search}
          onChange={handleSearchChange}
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
          onChange={handleCategoryChange}
          sx={{ minWidth: 160 }}
        >
          {categoryOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={dateFilter}
          onChange={handleDateChange}
          sx={{ minWidth: 140 }}
        >
          {DATE_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <ExportButtons
          data={filtered}
          columns={[
            { label: t('common.date'), key: 'date' },
            { label: t('expenses.description'), key: 'description' },
            { label: t('expenses.category'), key: 'category' },
            { label: t('expenses.amount'), key: 'amount', format: fmtCurrency },
          ]}
          fileName="expenses"
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ minWidth: 700 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('common.date')}</TableCell>
                <TableCell>{t('expenses.description')}</TableCell>
                <TableCell align="center">{t('expenses.category')}</TableCell>
                <TableCell align="right">{t('expenses.amount')}</TableCell>
                <TableCell align="center">{t('expenses.recurring')}</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('expenses.noExpensesFound')}
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((expense) => (
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
                        ? t('expenses.oneTime')
                        : expense.recurring === 'monthly'
                          ? t('expenses.monthly')
                          : t('expenses.yearly')}
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

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[20]}
        labelRowsPerPage={t('common.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
        dir={dir}
      />

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
          <ListItemText>{t('common.edit')}</ListItemText>
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
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}
