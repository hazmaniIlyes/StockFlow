import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useInventory, useTranslation } from 'src/contexts';

import { ConfirmDialog } from 'src/components/confirm-dialog';
import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { DashboardContent } from 'src/layouts/dashboard';

import { InventoryKpiCards } from '../inventory-kpi-cards';
import { InventoryTable } from '../inventory-table';
import { InventoryFormDialog } from '../inventory-form-dialog';
import { InventoryStockDialog } from '../inventory-stock-dialog';

import type { InventoryProduct, ProductUnit } from 'src/_mock/_data';

// ======================================================================

export function InventoryView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError } = useSnackbar();
  const { products, addProduct, updateProduct, deleteProduct, adjustStock } = useInventory();

  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<InventoryProduct | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryProduct | null>(null);

  // KPI calculations - now from shared context
  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const stockValue = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);
    const lowStockCount = products.filter((p) => p.status === 'low-stock').length;
    const outOfStockCount = products.filter((p) => p.status === 'out-of-stock').length;
    return { totalProducts, stockValue, lowStockCount, outOfStockCount };
  }, [products]);

  const handleView = (productId: string) => {
    navigate(`/inventory/${productId}`);
  };

  const handleEdit = (product: InventoryProduct) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditProduct(null);
    setFormOpen(true);
  };

  const handleFormSubmit = useCallback(
    (data: {
      name: string;
      sku: string;
      category: string;
      supplierId: string;
      supplierName: string;
      buyingPrice: number;
      sellPrice: number;
      stock: number;
      minStock: number;
      unit: ProductUnit;
      expiryDate?: string;
    }) => {
      try {
        if (editProduct) {
          updateProduct(editProduct.id, data);
          showSuccess(t('inventory.productUpdated'));
        } else {
          const newProduct = addProduct(data);
          showSuccess(t('inventory.productAdded'), {
            label: t('common.view'),
            onClick: () => navigate(`/inventory/${newProduct.id}`),
          });
        }
        setFormOpen(false);
        setEditProduct(null);
      } catch (e) {
        showError(t('inventory.failedToSave'));
      }
    },
    [editProduct, addProduct, updateProduct, navigate, showSuccess, showError, t]
  );

  const handleAdjustStock = (product: InventoryProduct) => {
    setStockProduct(product);
  };

  const handleStockSubmit = useCallback(
    (productId: string, type: 'add' | 'remove', quantity: number, _reason: string) => {
      const success = adjustStock(productId, quantity, type);
      if (success) {
        showSuccess(type === 'add' ? t('inventory.stockAddedSuccess') : t('inventory.stockRemovedSuccess'));
      } else {
        showError(t('inventory.insufficientStock'));
      }
      setStockProduct(null);
    },
    [adjustStock, showSuccess, showError, t]
  );

  const handleDeleteRequest = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setProductToDelete(product);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      showSuccess(t('inventory.productDeletedName', { name: productToDelete.name }));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">{t('inventory.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleAdd}
        >
          {t('inventory.addProduct')}
        </Button>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ mb: 3 }}>
        <InventoryKpiCards
          totalProducts={kpis.totalProducts}
          stockValue={kpis.stockValue}
          lowStockCount={kpis.lowStockCount}
          outOfStockCount={kpis.outOfStockCount}
        />
      </Box>

      {/* Product Table */}
      <InventoryTable
        products={products}
        onView={handleView}
        onEdit={handleEdit}
        onAdjustStock={handleAdjustStock}
        onDelete={handleDeleteRequest}
      />

      {/* Form Dialog */}
      {formOpen && (
        <InventoryFormDialog
          open={formOpen}
          product={editProduct}
          onClose={() => {
            setFormOpen(false);
            setEditProduct(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Stock Adjustment Dialog */}
      <InventoryStockDialog
        open={Boolean(stockProduct)}
        product={stockProduct}
        onClose={() => setStockProduct(null)}
        onSubmit={handleStockSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('inventory.deleteProduct')}
        content={t('inventory.confirmDeleteContent', { name: productToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
      />
    </DashboardContent>
  );
}
