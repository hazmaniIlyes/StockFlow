import { useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { useSettings, useTranslation } from 'src/contexts';

import type { Expense } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSubmit: (data: Omit<Expense, 'id'>) => void;
};

export function ExpensesFormDialog({ open, expense, onClose, onSubmit }: Props) {
  const { expenseCategories } = useSettings();
  const { t } = useTranslation();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setCategory(expense.category);
      setAmount(expense.amount);
      setDate(expense.date);
      setNote(expense.note);
    } else {
      setDescription('');
      setCategory(expenseCategories[0]?.label ?? 'Other');
      setAmount(0);
      setDate(new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
      setNote('');
    }
  }, [expense, open, expenseCategories]);

  const handleSubmit = () => {
    onSubmit({ description, category, amount, date, recurring: 'one-time', note });
    onClose();
  };

  const isValid = description.trim() !== '' && amount > 0 && date.trim() !== '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{expense ? t('expenses.editExpense') : t('expenses.addExpense')}</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
        <TextField
          fullWidth
          label={t('expenses.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('expenses.descriptionPlaceholder')}
        />

        <TextField
          select
          fullWidth
          label={t('expenses.category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {expenseCategories.length === 0 ? (
            <MenuItem disabled value="">
              <em>{t('settings.noCategoriesDropdown')}</em>
            </MenuItem>
          ) : (
            expenseCategories.map((cat) => (
              <MenuItem key={cat.id} value={cat.label}>
                {cat.label}
              </MenuItem>
            ))
          )}
        </TextField>

        <TextField
          fullWidth
          label={t('expenses.amountDA')}
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          slotProps={{ htmlInput: { min: 0 } }}
        />

        <TextField
          fullWidth
          label={t('common.date')}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder={t('expenses.datePlaceholder')}
        />

        <TextField
          fullWidth
          label={t('expenses.noteOptional')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          rows={2}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {expense ? t('common.update') : t('expenses.addExpense')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
