import type { BoxProps } from '@mui/material/Box';

import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Input from '@mui/material/Input';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemButton from '@mui/material/ListItemButton';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import { useRouter } from 'src/routes/hooks';

import { useClients } from 'src/contexts/clients-context';
import { useSettings, useTranslation } from 'src/contexts';
import { useExpenses } from 'src/contexts/expenses-context';
import { useInventory } from 'src/contexts/inventory-context';
import { useSuppliers } from 'src/contexts/suppliers-context';

import { Iconify } from 'src/components/iconify';

import { useInvoices } from 'src/sections/sales/context';

// ----------------------------------------------------------------------

type SearchResult = {
  id: string;
  category: string;
  label: string;
  sublabel: string;
  icon: string;
  href: string;
};

const MAX_PER_CATEGORY = 5;

export function Searchbar({ sx, ...other }: BoxProps) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { role } = useSettings();
  const isWorker = role === 'worker';

  const { products } = useInventory();
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const { suppliers } = useSuppliers();
  const { expenses } = useExpenses();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleOpen = useCallback(() => setOpen(true), []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: SearchResult[] = [];

    // Products (always visible)
    products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_CATEGORY)
      .forEach((p) =>
        out.push({
          id: p.id,
          category: t('nav.inventory'),
          label: p.name,
          sublabel: `${p.sku} · ${p.category}`,
          icon: 'solar:box-bold-duotone',
          href: `/inventory/${p.id}`,
        })
      );

    // Clients (always visible)
    clients
      .filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      )
      .slice(0, MAX_PER_CATEGORY)
      .forEach((c) =>
        out.push({
          id: c.id,
          category: t('nav.clients'),
          label: c.name,
          sublabel: c.phone,
          icon: 'solar:users-group-two-rounded-bold-duotone',
          href: `/clients/${c.id}`,
        })
      );

    // Sales / Invoices (always visible)
    invoices
      .filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.client.name.toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_CATEGORY)
      .forEach((inv) =>
        out.push({
          id: inv.id,
          category: t('nav.sales'),
          label: inv.invoiceNumber,
          sublabel: inv.client.name,
          icon: 'solar:document-bold-duotone',
          href: `/sales/${inv.id}`,
        })
      );

    // Suppliers — admin only
    if (!isWorker) {
      suppliers
        .filter(
          (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q)
        )
        .slice(0, MAX_PER_CATEGORY)
        .forEach((s) =>
          out.push({
            id: s.id,
            category: t('nav.suppliers'),
            label: s.name,
            sublabel: s.phone,
            icon: 'solar:delivery-bold-duotone',
            href: `/suppliers/${s.id}`,
          })
        );

      // Expenses — admin only
      expenses
        .filter(
          (e) =>
            e.description.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)
        )
        .slice(0, MAX_PER_CATEGORY)
        .forEach((e) =>
          out.push({
            id: e.id,
            category: t('nav.expenses'),
            label: e.description,
            sublabel: `${e.category} · ${e.amount.toLocaleString()} DA`,
            icon: 'solar:wallet-money-bold-duotone',
            href: `/expenses`,
          })
        );
    }

    return out;
  }, [query, products, clients, invoices, suppliers, expenses, isWorker, t]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    });
    return Array.from(map.entries());
  }, [results]);

  const showDropdown = query.trim().length >= 2;

  const handleNavigate = useCallback(
    (href: string) => {
      handleClose();
      router.push(href);
    },
    [handleClose, router]
  );

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div>
        {!open && (
          <IconButton onClick={handleOpen}>
            <Iconify icon="eva:search-fill" />
          </IconButton>
        )}

        <Slide direction="down" in={open} mountOnEnter unmountOnExit>
          <Box
            sx={{
              top: 0,
              left: 0,
              zIndex: 99,
              width: '100%',
              display: 'flex',
              position: 'absolute',
              alignItems: 'center',
              px: { xs: 3, md: 5 },
              boxShadow: theme.vars.customShadows.z8,
              height: {
                xs: 'var(--layout-header-mobile-height)',
                md: 'var(--layout-header-desktop-height)',
              },
              backdropFilter: `blur(6px)`,
              WebkitBackdropFilter: `blur(6px)`,
              backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.8),
              ...sx,
            }}
            {...other}
          >
            <Input
              autoFocus
              fullWidth
              disableUnderline
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('layout.searchPlaceholder')}
              startAdornment={
                <InputAdornment position="start">
                  <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              }
              sx={{ fontWeight: 'fontWeightBold' }}
            />
            <IconButton onClick={handleClose} sx={{ ml: 1, flexShrink: 0 }}>
              <Iconify icon="eva:close-fill" width={20} />
            </IconButton>

            {/* Results dropdown */}
            {showDropdown && (
              <Paper
                elevation={12}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: { xs: 16, md: 40 },
                  right: { xs: 16, md: 40 },
                  mt: 0.5,
                  maxHeight: 480,
                  overflow: 'auto',
                  borderRadius: 2,
                  zIndex: 100,
                }}
              >
                {grouped.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      {t('layout.noResults')}
                    </Typography>
                  </Box>
                ) : (
                  grouped.map(([category, items], groupIdx) => (
                    <Box key={category}>
                      {groupIdx > 0 && <Divider />}
                      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                        <Typography
                          variant="overline"
                          sx={{ color: 'text.disabled', fontSize: 11, letterSpacing: 1 }}
                        >
                          {category}
                        </Typography>
                      </Box>
                      <List disablePadding dense>
                        {items.map((item) => (
                          <ListItemButton
                            key={item.id}
                            onClick={() => handleNavigate(item.href)}
                            sx={{ px: 2, py: 0.75, gap: 1.5 }}
                          >
                            <Iconify
                              icon={item.icon}
                              width={20}
                              sx={{ color: 'text.secondary', flexShrink: 0 }}
                            />
                            <ListItemText
                              primary={item.label}
                              secondary={item.sublabel}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Box>
                  ))
                )}
              </Paper>
            )}
          </Box>
        </Slide>
      </div>
    </ClickAwayListener>
  );
}
