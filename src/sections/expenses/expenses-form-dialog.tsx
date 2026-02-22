import { useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { EXPENSE_CATEGORIES } from 'src/_mock/_data';
import type { Expense, ExpenseCategory, ExpenseRecurring } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSubmit: (data: Omit<Expense, 'id'>) => void;
};

export function ExpensesFormDialog({ open, expense, onClose, onSubmit }: Props) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('');
  const [recurring, setRecurring] = useState<ExpenseRecurring>('one-time');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setCategory(expense.category);
      setAmount(expense.amount);
      setDate(expense.date);
      setRecurring(expense.recurring);
      setNote(expense.note);
    } else {
      setDescription('');
      setCategory('other');
      setAmount(0);
      setDate(new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
      setRecurring('one-time');
      setNote('');
    }
  }, [expense, open]);

  const handleSubmit = () => {
    onSubmit({ description, category, amount, date, recurring, note });
    onClose();
  };

  const isValid = description.trim() !== '' && amount > 0 && date.trim() !== '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Shop rent — February"
        />

        <TextField
          select
          fullWidth
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <MenuItem key={cat.value} value={cat.value}>
              {cat.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Amount (DA)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          slotProps={{ htmlInput: { min: 0 } }}
        />

        <TextField
          fullWidth
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="MM/DD/YYYY"
        />

        <TextField
          select
          fullWidth
          label="Recurring"
          value={recurring}
          onChange={(e) => setRecurring(e.target.value as ExpenseRecurring)}
        >
          <MenuItem value="one-time">One-time</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="yearly">Yearly</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          rows={2}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {expense ? 'Update' : 'Add Expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
