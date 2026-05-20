import type { Supplier } from 'src/_mock/_data';

import { useNavigate } from 'react-router-dom';
import { useRef, useMemo, useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { useSuppliers, useInventory, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { SuppliersTable } from '../suppliers-table';
import { SuppliersKpiCards } from '../suppliers-kpi-cards';
import { SuppliersFormDialog } from '../suppliers-form-dialog';
import { SuppliersPaymentDialog } from '../suppliers-payment-dialog';

// ======================================================================

export function SuppliersView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError } = useSnackbar();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, recordPayment, recordPurchase, registerInventorySync } = useSuppliers();
  const { addProduct, products, updateProduct } = useInventory();

  const [formOpen, setFormOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Keep a ref that always points at the latest products so the rename sync
  // callback (registered below) can see fresh data without being re-created
  // every time products changes — same pattern as clientsRef in clients-context.
  const productsRef = useRef(products);
  useEffect(() => { productsRef.current = products; }, [products]);

  // Register the inventory sync callback once (stable refs mean no re-runs).
  // When a supplier is renamed, updateSupplier fires inventorySyncRef.current,
  // which calls this closure. It iterates all products via productsRef.current
  // and patches their supplierName so the inventory table shows the new name.
  useEffect(() => {
    registerInventorySync((supplierId, newName) => {
      productsRef.current
        .filter((p) => p.supplierId === supplierId)
        .forEach((p) => updateProduct(p.id, { supplierName: newName }));
    });
    return () => registerInventorySync(null); // clean up on unmount
  }, [registerInventorySync, updateProduct]); // updateProduct is stable (useCallback [])

  // KPI calculations - from shared context
  const kpis = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.status === 'active').length;
    const totalOwed = suppliers.reduce((sum, s) => sum + s.totalOwed, 0);
    const totalPurchased = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0);
    return { totalSuppliers, activeSuppliers, totalOwed, totalPurchased };
  }, [suppliers]);

  const handleView = (supplier: Supplier) => {
    navigate(`/suppliers/${supplier.id}`);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditSupplier(null);
    setFormOpen(true);
  };

  const handleFormSubmit = useCallback(
    (data: {
      name: string;
      phone: string;
      address: string;
      email: string;
      nif?: string;
      nis?: string;
      rc?: string;
      ai?: string;
      status: 'active' | 'inactive';
      catalog: { name: string; buyingPrice: number; category: string; purchaseDate?: string; expiryDate?: string; sellPrice: number; stock: number; unit: string }[];
      initialDebt: number;
      debtDueDate?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      try {
        if (editSupplier) {
          updateSupplier(editSupplier.id, {
            name: data.name,
            phone: data.phone,
            address: data.address,
            email: data.email,
            nif: data.nif,
            nis: data.nis,
            rc: data.rc,
            ai: data.ai,
            status: data.status,
            catalog: data.catalog.map((p, i) => ({
              ...p,
              purchaseDate: p.purchaseDate || today,
              expiryDate: p.expiryDate || undefined,
              id: editSupplier.catalog[i]?.id ?? `sp-new-${Date.now()}-${i}`,
              unit: (p.unit || 'pcs') as any,
            })),
          });
          showSuccess(t('suppliers.supplierUpdated'));
        } else {
          const catalogProducts = data.catalog.filter((p) => p.name.trim());
          
          // Create supplier with zero financial values - recordPurchase will set them
          const newSupplier = addSupplier({
            name: data.name,
            phone: data.phone,
            address: data.address,
            email: data.email,
            nif: data.nif,
            nis: data.nis,
            rc: data.rc,
            ai: data.ai,
            status: data.status,
            catalog: catalogProducts.map((p) => ({
              ...p,
              purchaseDate: p.purchaseDate || today,
              expiryDate: p.expiryDate || undefined,
              unit: (p.unit || 'pcs') as any,
            })),
            totalPurchased: 0,
            totalOwed: 0,
            debtDueDate: data.debtDueDate,
          });

          // Create purchase items for the purchase record
          const purchaseItems = catalogProducts.map((product) => ({
            productName: product.name,
            quantity: product.stock || 1,
            unitPrice: product.buyingPrice,
          }));

          // Record the initial purchase (if there are products)
          if (purchaseItems.length > 0) {
            const purchaseTotal = purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            const amountPaid = Math.max(0, purchaseTotal - (data.initialDebt || 0));
            recordPurchase(newSupplier.id, purchaseItems, amountPaid);
          }

          // Add products to inventory
          catalogProducts.forEach((product, index) => {
            addProduct({
              name: product.name,
              sku: '', // Auto-generated by inventory context
              category: product.category,
              supplierId: newSupplier.id,
              supplierName: data.name,
              buyingPrice: product.buyingPrice,
              sellPrice: product.sellPrice || 0,
              stock: product.stock || 0,
              minStock: 5,
              unit: (product.unit as any) || 'pcs',
              expiryDate: product.expiryDate || undefined,
            });
          });

          showSuccess(t('suppliers.supplierAdded'));
        }
        setFormOpen(false);
        setEditSupplier(null);
      } catch (e) {
        showError(t('suppliers.failedToSave'));
      }
    },
    [editSupplier, addSupplier, updateSupplier, addProduct, recordPurchase, showSuccess, showError]
  );

  const handleDeleteRequest = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (supplier) {
      setSupplierToDelete(supplier);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      showSuccess(t('suppliers.supplierDeleted'));
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleRecordPayment = (supplier: Supplier) => {
    setPaymentSupplier(supplier);
  };

  const handlePaymentSubmit = useCallback(
    (supplierId: string, amount: number, note: string) => {
      recordPayment(supplierId, amount, note);
      showSuccess(t('suppliers.paymentRecorded', { amount: amount.toLocaleString() }));
    },
    [recordPayment, showSuccess, t]
  );

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">{t('suppliers.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleAdd}
        >
          {t('suppliers.addSupplier')}
        </Button>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ mb: 3 }}>
        <SuppliersKpiCards
          totalSuppliers={kpis.totalSuppliers}
          activeSuppliers={kpis.activeSuppliers}
          totalOwed={kpis.totalOwed}
          totalPurchased={kpis.totalPurchased}
        />
      </Box>

      {/* Supplier Table */}
      <SuppliersTable
        suppliers={suppliers}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onRecordPayment={handleRecordPayment}
      />

      {/* Form Dialog */}
      {formOpen && (
        <SuppliersFormDialog
          open={formOpen}
          supplier={editSupplier}
          onClose={() => {
            setFormOpen(false);
            setEditSupplier(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Payment Dialog */}
      <SuppliersPaymentDialog
        open={Boolean(paymentSupplier)}
        supplier={paymentSupplier}
        onClose={() => setPaymentSupplier(null)}
        onSubmit={handlePaymentSubmit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('suppliers.deleteSupplier')}
        content={t('suppliers.confirmDeleteContent', { name: supplierToDelete?.name || '' })}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSupplierToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </DashboardContent>
  );
}
