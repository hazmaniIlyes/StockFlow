import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type Category = { id: string; label: string; color: string };

const INITIAL_PRODUCT_CATEGORIES: Category[] = [
  { id: 'pc-1', label: 'Peripherals', color: '#1976D2' },
  { id: 'pc-2', label: 'Accessories', color: '#9C27B0' },
  { id: 'pc-3', label: 'Audio', color: '#ED6C02' },
  { id: 'pc-4', label: 'Storage', color: '#2E7D32' },
  { id: 'pc-5', label: 'Cables', color: '#0288D1' },
  { id: 'pc-6', label: 'Other', color: '#757575' },
];

const INITIAL_EXPENSE_CATEGORIES: Category[] = [
  { id: 'ec-1', label: 'Rent', color: '#FF6B6B' },
  { id: 'ec-2', label: 'Utilities', color: '#4ECDC4' },
  { id: 'ec-3', label: 'Transport', color: '#45B7D1' },
  { id: 'ec-4', label: 'Salaries', color: '#96CEB4' },
  { id: 'ec-5', label: 'Maintenance', color: '#FECA57' },
  { id: 'ec-6', label: 'Other', color: '#A29BFE' },
];

// ======================================================================

function CategorySection({
  title,
  categories,
  onAdd,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">{title}</Typography>
        <Button
          size="small"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={18} />}
          onClick={onAdd}
        >
          Add
        </Button>
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={1}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            onDelete={() => onDelete(cat.id)}
            sx={{
              borderLeft: `4px solid ${cat.color}`,
              fontWeight: 500,
            }}
          />
        ))}
        {categories.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            No categories yet.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

// ======================================================================

export function SettingsCategories() {
  const theme = useTheme();

  const [productCats, setProductCats] = useState<Category[]>(INITIAL_PRODUCT_CATEGORIES);
  const [expenseCats, setExpenseCats] = useState<Category[]>(INITIAL_EXPENSE_CATEGORIES);

  // Add dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'product' | 'expense'>('product');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#1976D2');

  const handleOpenAdd = (type: 'product' | 'expense') => {
    setDialogType(type);
    setNewLabel('');
    setNewColor('#1976D2');
    setDialogOpen(true);
  };

  const handleSave = () => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      label: newLabel.trim(),
      color: newColor,
    };

    if (dialogType === 'product') {
      setProductCats((prev) => [...prev, newCat]);
    } else {
      setExpenseCats((prev) => [...prev, newCat]);
    }
    setDialogOpen(false);
  };

  const handleDeleteProduct = (id: string) => setProductCats((prev) => prev.filter((c) => c.id !== id));
  const handleDeleteExpense = (id: string) => setExpenseCats((prev) => prev.filter((c) => c.id !== id));

  return (
    <>
      <Card
        sx={{
          p: 3,
          boxShadow: theme.vars.customShadows.z8,
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          Categories Management
        </Typography>

        <Stack spacing={3} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
          <CategorySection
            title="Product Categories"
            categories={productCats}
            onAdd={() => handleOpenAdd('product')}
            onDelete={handleDeleteProduct}
          />

          <CategorySection
            title="Expense Categories"
            categories={expenseCats}
            onAdd={() => handleOpenAdd('expense')}
            onDelete={handleDeleteExpense}
          />
        </Stack>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Add {dialogType === 'product' ? 'Product' : 'Expense'} Category
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              autoFocus
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Color:
              </Typography>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
              />
              <Chip
                label={newLabel || 'Preview'}
                sx={{ borderLeft: `4px solid ${newColor}`, fontWeight: 500 }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!newLabel.trim()} onClick={handleSave}>
            Add Category
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
