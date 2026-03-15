import React from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type ExportButtonsProps = {
  data: any[];
  columns: Array<{ key: string; label: string }>;
  fileName: string;
};

export function ExportButtons({ data, columns, fileName }: ExportButtonsProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
          newRow[col.label] = row[col.key] ?? '';
        });
        return newRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
      console.error('Excel export failed:', error);
    }
    handleClose();
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(fileName, 14, 15);
      
      // Transform data for table
      const tableData = data.map(row => 
        columns.map(col => String(row[col.key] ?? ''))
      );
      
      // Generate table
      autoTable(doc, {
        head: [columns.map(col => col.label)],
        body: tableData,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] },
      });
      
      doc.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
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
        Export
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
          <ListItemText>Export to Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportPDF}>
          <ListItemIcon>
            <Iconify icon="vscode-icons:file-type-pdf2" width={20} />
          </ListItemIcon>
          <ListItemText>Export to PDF</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
