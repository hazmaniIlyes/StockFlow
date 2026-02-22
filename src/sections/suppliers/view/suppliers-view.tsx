import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { _suppliers } from 'src/_mock';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { SuppliersKpiCards } from '../suppliers-kpi-cards';
import { SuppliersTable } from '../suppliers-table';
import { SuppliersFormDialog } from '../suppliers-form-dialog';
import { SuppliersPaymentDialog } from '../suppliers-payment-dialog';

import type { Supplier } from 'src/_mock/_data';

// ======================================================================

export function SuppliersView() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>(_suppliers);
  const [formOpen, setFormOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  // KPI calculations
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
      status: 'active' | 'inactive';
      catalog: { name: string; buyingPrice: number; category: string }[];
    }) => {
      if (editSupplier) {
        // Update existing supplier
        setSuppliers((prev) =>
          prev.map((s) => {
            if (s.id !== editSupplier.id) return s;
            return {
              ...s,
              name: data.name,
              phone: data.phone,
              address: data.address,
              email: data.email,
              status: data.status,
              catalog: data.catalog.map((p, i) => ({
                ...p,
                id: s.catalog[i]?.id ?? `sp-new-${Date.now()}-${i}`,
              })),
            };
          })
        );
      } else {
        // Add new supplier
        const newId = `sup-${Date.now()}`;
        const newSupplier: Supplier = {
          id: newId,
          name: data.name,
          phone: data.phone,
          address: data.address,
          email: data.email,
          status: data.status,
          catalog: data.catalog.map((p, i) => ({ ...p, id: `sp-${newId}-${i}` })),
          totalPurchased: 0,
          totalOwed: 0,
          totalPaid: 0,
        };
        setSuppliers((prev) => [newSupplier, ...prev]);
      }
    },
    [editSupplier]
  );

  const handleDelete = useCallback((supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  }, []);

  const handleRecordPayment = (supplier: Supplier) => {
    setPaymentSupplier(supplier);
  };

  const handlePaymentSubmit = useCallback(
    (supplierId: string, amount: number, _note: string) => {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== supplierId) return s;
          const newOwed = Math.max(0, s.totalOwed - amount);
          return { ...s, totalPaid: s.totalPaid + amount, totalOwed: newOwed };
        })
      );
    },
    []
  );

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Suppliers</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleAdd}
        >
          Add Supplier
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
        onDelete={handleDelete}
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
    </DashboardContent>
  );
}
