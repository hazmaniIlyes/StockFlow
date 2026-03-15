import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Client } from 'src/_mock/_data';

// ======================================================================

type ClientsContextType = {
  clients: Client[];
  getClient: (id: string) => Client | undefined;
  getClientByName: (name: string) => Client | undefined;
  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  recordPayment: (id: string, amount: number) => void;
  updateClientFromInvoice: (
    clientName: string,
    phone: string,
    address: string,
    invoiceTotal: number,
    amountPaid: number,
    taxInfo?: { nif?: string; nis?: string; rc?: string; ai?: string }
  ) => void;
  clearAll: () => void;
};

const ClientsContext = createContext<ClientsContextType | null>(null);

export function useClients() {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
}

type ProviderProps = {
  children: ReactNode;
};

export function ClientsProvider({ children }: ProviderProps) {
  const [clients, setClients] = useState<Client[]>([]);

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  const getClientByName = useCallback(
    (name: string) => clients.find((c) => c.name.toLowerCase() === name.toLowerCase()),
    [clients]
  );

  const addClient = useCallback((data: Omit<Client, 'id'>) => {
    const newClient: Client = { ...data, id: `client-${Date.now()}` };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const recordPayment = useCallback((id: string, amount: number) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newTotalPaid = c.totalPaid + amount;
        const newRemainingBalance = Math.max(0, c.remainingBalance - amount);
        return {
          ...c,
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance <= 0 ? 'paid' : 'unpaid',
        };
      })
    );
  }, []);

  // Update or create client when an invoice is created/updated
  const updateClientFromInvoice = useCallback(
    (
      clientName: string,
      phone: string,
      address: string,
      invoiceTotal: number,
      amountPaid: number,
      taxInfo?: { nif?: string; nis?: string; rc?: string; ai?: string }
    ) => {
      setClients((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.name.toLowerCase() === clientName.toLowerCase()
        );

        if (existingIndex >= 0) {
          // Update existing client
          const updated = [...prev];
          const existing = updated[existingIndex];
          updated[existingIndex] = {
            ...existing,
            phone: phone || existing.phone,
            address: address || existing.address,
            nif: taxInfo?.nif || existing.nif,
            nis: taxInfo?.nis || existing.nis,
            rc: taxInfo?.rc || existing.rc,
            ai: taxInfo?.ai || existing.ai,
            totalPurchases: existing.totalPurchases + invoiceTotal,
            totalPaid: existing.totalPaid + amountPaid,
            remainingBalance: existing.remainingBalance + (invoiceTotal - amountPaid),
            lastInvoiceDate: new Date().toLocaleDateString('en-US'),
            status: existing.remainingBalance + (invoiceTotal - amountPaid) > 0 ? 'unpaid' : 'paid',
          };
          return updated;
        }

        // Create new client
        const newClient: Client = {
          id: `client-${Date.now()}`,
          name: clientName,
          phone,
          address,
          nif: taxInfo?.nif,
          nis: taxInfo?.nis,
          rc: taxInfo?.rc,
          ai: taxInfo?.ai,
          totalPurchases: invoiceTotal,
          totalPaid: amountPaid,
          remainingBalance: invoiceTotal - amountPaid,
          lastInvoiceDate: new Date().toLocaleDateString('en-US'),
          status: invoiceTotal - amountPaid > 0 ? 'unpaid' : 'paid',
        };
        return [newClient, ...prev];
      });
    },
    []
  );

  const clearAll = useCallback(() => setClients([]), []);

  const value = useMemo(
    () => ({
      clients,
      getClient,
      getClientByName,
      addClient,
      updateClient,
      deleteClient,
      recordPayment,
      updateClientFromInvoice,
      clearAll,
    }),
    [
      clients,
      getClient,
      getClientByName,
      addClient,
      updateClient,
      deleteClient,
      recordPayment,
      updateClientFromInvoice,
      clearAll,
    ]
  );

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}
