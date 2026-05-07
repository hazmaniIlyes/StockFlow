import React from 'react';
import * as XLSX from 'xlsx';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type ExportButtonsProps = {
  data: any[];
  columns: Array<{ key: string; label: string; format?: (value: any) => string }>;
  fileName: string;
};

export function ExportButtons({ data, columns, fileName }: ExportButtonsProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { t, language, dir } = useTranslation();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportExcel = () => {
    try {
      // Transform data to include only specified columns
      const exportData = data.map(row => {
        const newRow: any = {};
        columns.forEach(col => {
          const raw = row[col.key] ?? '';
          newRow[col.label] = col.format ? col.format(raw) : raw;
        });
        return newRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
      window.appLog?.error('Excel export failed:', error);
    }
    handleClose();
  };

  const buildHtml = () => {
    const isRTL = dir === 'rtl';
    const headers = columns.map((col) => `<th>${col.label}</th>`).join('');
    const rows = data
      .map((row) => {
        const cells = columns.map((col) => {
          const raw = row[col.key] ?? '';
          const value = col.format ? col.format(raw) : String(raw);
          return `<td>${value}</td>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html dir="${dir}" lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, 'Segoe UI', Tahoma, sans-serif; padding: 20px; direction: ${dir}; font-size: 12px; color: #111; }
    h2 { font-size: 18px; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; }
    th { background-color: #1976d2; color: #fff; font-weight: 600; }
    tr:nth-child(even) { background-color: #f5f5f5; }
    .print-bar { margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; }
    .btn { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
    .btn-primary { background: #1976d2; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    @media print { .print-bar { display: none; } }
  </style>
</head>
<body>
  <h2>${fileName}</h2>
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  };

  const handlePrint = () => {
    try {
      const html = buildHtml();
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(html.replace('</body>', `
  <div class="print-bar">
    <button class="btn btn-secondary" onclick="window.close()">${t('common.cancel')}</button>
    <button class="btn btn-primary" onclick="window.print()">${t('common.print')}</button>
  </div>
</body>`));
      win.document.close();
    } catch (error) {
      window.appLog?.error('Print failed:', error);
    }
    handleClose();
  };

  const handleSavePdf = () => {
    try {
      const html = buildHtml();
      const db = (window as any).database;
      if (db?.savePdf) {
        db.savePdf(html, fileName);
      } else {
        // Fallback for non-Electron environments
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.print();
      }
    } catch (error) {
      window.appLog?.error('PDF save failed:', error);
    }
    handleClose();
  };


  return (
    <Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Iconify icon="solar:import-bold-duotone" width={18} />}
        onClick={handleClick}
      >
        {t('common.export')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleExportExcel}>
          <ListItemIcon>
            <Iconify icon="vscode-icons:file-type-excel" width={20} />
          </ListItemIcon>
          <ListItemText>{t('common.exportToExcel')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <ListItemIcon>
            <Iconify icon="solar:printer-bold-duotone" width={20} />
          </ListItemIcon>
          <ListItemText>{t('common.print')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSavePdf}>
          <ListItemIcon>
            <Iconify icon="vscode-icons:file-type-pdf2" width={20} />
          </ListItemIcon>
          <ListItemText>{t('common.saveAsPdf')}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
