import type { ReactNode } from 'react';
import type { Client } from 'src/_mock/_data';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { clientsDB, isElectron } from 'src/services/db'; // Import database service for SQLite client operations

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

  // ── Load clients from SQLite on mount ──────────────────────────────
  // Replaces the old useState([]) that used no initial data or mock data.
  useEffect(() => {
    if (isElectron()) {
      // Load all clients from the SQLite database when the context provider mounts
      clientsDB.getAll().then((dbClients) => {
        console.log('[ClientsContext] Loaded clients from SQLite:', dbClients.length);
        setClients(dbClients); // Populate React state with database data
      }).catch((err) => {
        console.error('[ClientsContext] Failed to load clients from SQLite:', err);
      });
    }
  }, []); // Empty deps = run only once on mount

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  const getClientByName = useCallback(
    (name: string) => clients.find((c) => c.name.toLowerCase() === name.toLowerCase()),
    [clients]
  );

  const addClient = useCallback((data: Omit<Client, 'id'>) => {
    const newClient: Client = { ...data, id: `client-${Date.now()}` }; // Generate unique ID

    // ── Persist new client to SQLite ──────────────────────────────────
    if (isElectron()) {
      clientsDB.add(newClient).catch((err) => {
        console.error('[ClientsContext] Failed to add client to SQLite:', err);
      });
    }

    setClients((prev) => [newClient, ...prev]); // Add to front of list
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    // ── Persist update to SQLite ─────────────────────────────────────
    if (isElectron()) {
      clientsDB.update(id, data).catch((err) => {
        console.error('[ClientsContext] Failed to update client in SQLite:', err);
      });
    }

    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const deleteClient = useCallback((id: string) => {
    // ── Delete from SQLite ───────────────────────────────────────────
    if (isElectron()) {
      clientsDB.delete(id).catch((err) => {
        console.error('[ClientsContext] Failed to delete client from SQLite:', err);
      });
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const recordPayment = useCallback((id: string, amount: number) => {
    // 1. Locate the client natively outside the React loop
    const target = clients.find((c) => c.id === id);
    if (!target) return;

    const newTotalPaid = target.totalPaid + amount;
    const newRemainingBalance = Math.max(0, target.remainingBalance - amount);
    const newStatus = newRemainingBalance <= 0 ? 'paid' : 'unpaid';

    // 2. Safely trigger SQLite exactly once
    if (isElectron()) {
      clientsDB.update(id, {
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        status: newStatus,
      }).catch((err) => {
        console.error('[ClientsContext] Failed to record payment in SQLite:', err);
      });
    }

    // 3. Queue the pure setState updater securely
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              totalPaid: newTotalPaid,
              remainingBalance: newRemainingBalance,
              status: newStatus,
            }
          : c
      )
    );
  }, [clients]);

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
      // 1. Evaluate synchronously using standard closure scope to prevent React Double-Render errors
      const existing = clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase());

      if (existing) {
        // Build updated client map
        const updatedClient = {
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
          status: (existing.remainingBalance + (invoiceTotal - amountPaid) > 0 ? 'unpaid' : 'paid') as Client['status'],
        };

        // 2. Safely call SQLite side-effect EXACTLY ONCE block before setting state!
        if (isElectron()) {
          clientsDB.update(existing.id, {
            phone: updatedClient.phone,
            address: updatedClient.address,
            nif: updatedClient.nif,
            nis: updatedClient.nis,
            rc: updatedClient.rc,
            ai: updatedClient.ai,
            totalPurchases: updatedClient.totalPurchases,
            totalPaid: updatedClient.totalPaid,
            remainingBalance: updatedClient.remainingBalance,
            lastInvoiceDate: updatedClient.lastInvoiceDate,
            status: updatedClient.status,
          }).catch((err) => {
            console.error('[ClientsContext] Failed to update client from invoice in SQLite:', err);
          });
        }

        // 3. Delegate pure logic directly to React
        setClients((prev) => prev.map((c) => (c.id === existing.id ? updatedClient : c)));
      } else {
        // Client doesn't exist, safely bootstrap a new profile
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

        // Execute side-effect EXACTLY ONCE block
        if (isElectron()) {
          clientsDB.add(newClient).catch((err) => {
            console.error('[ClientsContext] Failed to add new client from invoice to SQLite:', err);
          });
        }

        // Delegate pure append logic explicitly backwards
        setClients((prev) => [newClient, ...prev]);
      }
    },
    [clients] // Vital dependency addition to capture existing matrix
  );

  const clearAll = useCallback(() => {
    // ── Clear all clients from SQLite ────────────────────────────────
    if (isElectron()) {
      clientsDB.clearAll().catch((err) => {
        console.error('[ClientsContext] Failed to clear all clients from SQLite:', err);
      });
    }

    setClients([]);
  }, []);

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
