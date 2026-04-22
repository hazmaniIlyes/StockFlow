import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  htmlContent: string;
};

export function SalesPrintPreviewDialog({ open, onClose, htmlContent }: Props) {
  const handlePrint = () => {
    (window as any).database?.printHtml(htmlContent);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 860,
          maxWidth: 860,
          height: '95vh',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#616161',
        },
      }}
    >
      {/* Grey area — invoice rendered at exact A4 width inside, scroll if taller */}
      <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto', bgcolor: '#616161' }}>
        <iframe
          key={htmlContent}
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', minHeight: 700, border: 'none', display: 'block' }}
          title="Print Preview"
          onLoad={(e) => {
            const doc = e.currentTarget.contentDocument;
            if (doc) {
              const h = doc.documentElement.scrollHeight;
              if (h > 0) e.currentTarget.style.height = h + 'px';
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ ml: 'auto' }}>
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:printer-bold-duotone" width={18} />}
          onClick={handlePrint}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
