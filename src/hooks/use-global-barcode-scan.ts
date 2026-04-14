import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useInventory, useGlobalScan } from 'src/contexts';
import { useBarcodeScan } from './use-barcode-scan';

export function useGlobalBarcodeScan() {
  const navigate = useNavigate();
  const { products } = useInventory();
  const { isFormOpen } = useGlobalScan();

  const handleScan = useCallback(
    (sku: string) => {
      const trimmed = sku.trim();
      if (!trimmed) return;

      const matched = products.find((p) => p.sku === trimmed);
      
      if (matched) {
        // Found -> navigate to product details
        navigate(`/inventory/${matched.id}`);
      } else {
        // Not found -> open Add Product dialog with SKU pre-filled via URL state
        navigate(`/inventory`, { state: { addSku: trimmed } });
      }
    },
    [products, products.length, navigate]
  );

  const enabled = !isFormOpen && products.length > 0;

  // The global listener is purely disabled if any form is open OR if products haven't loaded
  useBarcodeScan(enabled, handleScan);
}

// Headless component to mount the hook cleanly in the App tree
export function GlobalBarcodeScanListener() {
  useGlobalBarcodeScan();
  return null;
}
