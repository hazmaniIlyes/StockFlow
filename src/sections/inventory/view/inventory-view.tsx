import { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { _inventory } from 'src/_mock';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { InventoryKpiCards } from '../inventory-kpi-cards';
import { InventoryTable } from '../inventory-table';
import { InventoryFormDialog } from '../inventory-form-dialog';
import { InventoryStockDialog } from '../inventory-stock-dialog';

import type { InventoryProduct } from 'src/_mock/_data';

// ======================================================================

export function InventoryView() {
  const [products, setProducts] = useState<InventoryProduct[]>(_inventory);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<InventoryProduct | null>(null);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const stockValue = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);
    const lowStockCount = products.filter((p) => p.status === 'low-stock').length;
    const outOfStockCount = products.filter((p) => p.status === 'out-of-stock').length;
    return { totalProducts, stockValue, lowStockCount, outOfStockCount };
  }, [products]);

  const computeStatus = (stock: number, minStock: number): InventoryProduct['status'] => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'in-stock';
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
    }) => {
      if (editProduct) {
        // Update existing
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== editProduct.id) return p;
            const newStock = data.stock;
            return {
              ...p,
              ...data,
              status: computeStatus(newStock, data.minStock),
            };
          })
        );
      } else {
        // Add new
        const newProduct: InventoryProduct = {
          id: `inv-${Date.now()}`,
          ...data,
          status: computeStatus(data.stock, data.minStock),
        };
        setProducts((prev) => [newProduct, ...prev]);
      }
    },
    [editProduct]
  );

  const handleAdjustStock = (product: InventoryProduct) => {
    setStockProduct(product);
  };

  const handleStockSubmit = useCallback(
    (productId: string, type: 'add' | 'remove', quantity: number, _reason: string) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const newStock = type === 'add' ? p.stock + quantity : Math.max(0, p.stock - quantity);
          return {
            ...p,
            stock: newStock,
            status: computeStatus(newStock, p.minStock),
          };
        })
      );
    },
    []
  );

  const handleDelete = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Inventory</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleAdd}
        >
          Add Product
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
        onEdit={handleEdit}
        onAdjustStock={handleAdjustStock}
        onDelete={handleDelete}
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
    </DashboardContent>
  );
}
