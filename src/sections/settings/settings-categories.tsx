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
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { useSettings, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ======================================================================

type Category = { id: string; label: string; color: string };

// ======================================================================

function CategorySection({
  title,
  categories,
  onAdd,
  onDelete,
  addLabel,
  emptyText,
}: {
  title: string;
  categories: Category[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  addLabel: string;
  emptyText: string;
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
          {addLabel}
        </Button>
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={1}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            onDelete={() => onDelete(cat.id)}
            sx={{
              borderInlineStart: `4px solid ${cat.color}`,
              fontWeight: 500,
            }}
          />
        ))}
        {categories.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {emptyText}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

// ======================================================================

export function SettingsCategories() {
  const theme = useTheme();
  const { showSuccess } = useSnackbar();
  const { t } = useTranslation();
  const {
    productCategories,
    expenseCategories,
    addProductCategory,
    deleteProductCategory,
    addExpenseCategory,
    deleteExpenseCategory,
  } = useSettings();

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
    const newCat = { label: newLabel.trim(), color: newColor };

    if (dialogType === 'product') {
      addProductCategory(newCat);
      showSuccess(t('settings.productCategoryAdded', { name: newLabel }));
    } else {
      addExpenseCategory(newCat);
      showSuccess(t('settings.expenseCategoryAdded', { name: newLabel }));
    }
    setDialogOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    deleteProductCategory(id);
    showSuccess(t('settings.categoryDeleted'));
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpenseCategory(id);
    showSuccess(t('settings.categoryDeleted'));
  };

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
          {t('settings.categoriesManagement')}
        </Typography>

        <Stack spacing={3} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
          <CategorySection
            title={t('settings.productCategories')}
            categories={productCategories}
            onAdd={() => handleOpenAdd('product')}
            onDelete={handleDeleteProduct}
            addLabel={t('common.add')}
            emptyText={t('settings.noCategoriesYet')}
          />

          <CategorySection
            title={t('settings.expenseCategories')}
            categories={expenseCategories}
            onAdd={() => handleOpenAdd('expense')}
            onDelete={handleDeleteExpense}
            addLabel={t('common.add')}
            emptyText={t('settings.noCategoriesYet')}
          />
        </Stack>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dialogType === 'product' ? t('settings.addProductCategory') : t('settings.addExpenseCategory')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label={t('settings.categoryName')}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              autoFocus
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('settings.color')}:
              </Typography>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
              />
              <Chip
                label={newLabel || t('settings.preview')}
                sx={{ borderInlineStart: `4px solid ${newColor}`, fontWeight: 500 }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={!newLabel.trim()} onClick={handleSave}>
            {t('settings.addCategory')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
