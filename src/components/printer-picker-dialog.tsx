import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type PrinterInfo = {
  name: string;
  displayName: string;
  isDefault: boolean;
};

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  noPrinterLabel?: string;
  onSelect: (printerName: string) => void;
  onNoPrinter?: () => void;
  onClose: () => void;
};

export function PrinterPickerDialog({ open, title, subtitle, noPrinterLabel, onSelect, onNoPrinter, onClose }: Props) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(null);

    window.database?.getPrinters()
      .then((list) => {
        setPrinters(list || []);
        // Pre-select the default printer if there is one
        const defaultPrinter = list?.find((p) => p.isDefault);
        if (defaultPrinter) setSelected(defaultPrinter.name);
      })
      .catch(() => setPrinters([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Iconify icon="solar:printer-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : printers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Iconify icon="solar:printer-broken-bold-duotone" width={48} sx={{ opacity: 0.5, mb: 1 }} />
            <Typography variant="body2">No printers found.</Typography>
            <Typography variant="caption">Please install a printer in Windows first.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {printers.map((printer) => (
              <ListItem key={printer.name} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selected === printer.name}
                  onClick={() => setSelected(printer.name)}
                  sx={{ borderRadius: 1, border: '1px solid', borderColor: selected === printer.name ? 'primary.main' : 'divider' }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Iconify
                      icon={selected === printer.name ? 'solar:check-circle-bold' : 'solar:printer-minimalistic-bold-duotone'}
                      width={22}
                      sx={{ color: selected === printer.name ? 'primary.main' : 'text.secondary' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={printer.displayName}
                    secondary={printer.isDefault ? 'Default printer' : undefined}
                    slotProps={{ primary: { variant: 'subtitle2' }, secondary: { variant: 'caption' } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: onNoPrinter ? 'space-between' : 'flex-end' }}>
        {onNoPrinter && (
          <Button
            variant="text"
            color="inherit"
            onClick={onNoPrinter}
            startIcon={<Iconify icon="solar:close-circle-bold-duotone" width={18} />}
            sx={{ color: 'text.secondary', mr: 'auto' }}
          >
            {noPrinterLabel || "I don't have a printer"}
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selected}
            onClick={() => { if (selected) onSelect(selected); }}
          >
            Use this printer
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
