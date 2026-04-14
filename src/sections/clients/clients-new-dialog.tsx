import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useTranslation, useGlobalScan } from 'src/contexts';

import type { Client } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Client, 'id' | 'totalPurchases' | 'totalPaid' | 'remainingBalance' | 'lastInvoiceDate' | 'status'>) => void;
  editClient?: Client | null;
};

export function ClientsNewDialog({ open, onClose, onSave, editClient }: Props) {
  const { t } = useTranslation();
  const { setFormOpen } = useGlobalScan();

  useEffect(() => {
    setFormOpen(open);
    return () => setFormOpen(false);
  }, [open, setFormOpen]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nif, setNif] = useState('');
  const [nis, setNis] = useState('');
  const [rc, setRc] = useState('');
  const [ai, setAi] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editClient) {
        setName(editClient.name);
        setPhone(editClient.phone);
        setAddress(editClient.address);
        setNif(editClient.nif || '');
        setNis(editClient.nis || '');
        setRc(editClient.rc || '');
        setAi(editClient.ai || '');
      } else {
        setName('');
        setPhone('');
        setAddress('');
        setNif('');
        setNis('');
        setRc('');
        setAi('');
      }
      setErrors({});
    }
  }, [open, editClient]);

  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('clients.nameRequired');
    }

    if (!phone.trim()) {
      newErrors.phone = t('clients.phoneRequired');
    } else if (!/^[0-9+\-\s()]{8,}$/.test(phone.trim())) {
      newErrors.phone = t('clients.invalidPhone');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      nif: nif.trim() || undefined,
      nis: nis.trim() || undefined,
      rc: rc.trim() || undefined,
      ai: ai.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editClient ? t('clients.editClient') : t('clients.newClient')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label={t('clients.clientNameBusiness')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            autoFocus
          />

          <TextField
            label={t('common.phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            fullWidth
            placeholder="e.g. 0555 123 456"
          />

          <TextField
            label={t('common.address')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder={t('common.optional')}
          />

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" color="text.secondary">
            {t('clients.taxInfoOptional')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('clients.taxFields.nif')}
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('clients.taxFields.nis')}
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('clients.taxFields.rc')}
              value={rc}
              onChange={(e) => setRc(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('clients.taxFields.ai')}
              value={ai}
              onChange={(e) => setAi(e.target.value)}
              fullWidth
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained">
          {editClient ? t('common.update') : t('clients.addClient')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
