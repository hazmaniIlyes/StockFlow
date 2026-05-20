import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Step = {
  label: string;
  detail?: string;
};

type Section = {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  steps: Step[];
  notes?: string[];
};

type Chapter = {
  id: string;
  label: string;
  icon: string;
  sections: Section[];
};

// ----------------------------------------------------------------------

function StepBadge({ index }: { index: number }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: theme.palette.primary.main,
        color: '#fff',
        typography: 'caption',
        fontWeight: 700,
      }}
    >
      {index + 1}
    </Box>
  );
}

function SectionCard({ section }: { section: Section }) {
  const theme = useTheme();
  const colorVal = (theme.palette as any)[section.color]?.main ?? theme.palette.primary.main;
  const colorLight = (theme.palette as any)[section.color]?.light ?? theme.palette.primary.light;

  return (
    <Card
      sx={{
        p: 3,
        mb: 3,
        border: `1px solid ${alpha(colorVal, 0.15)}`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.5), 0 2px 8px 0 ${alpha(colorVal, 0.08)}`,
        backgroundImage: `linear-gradient(135deg, ${alpha(colorVal, 0.04)} 0%, transparent 100%)`,
        borderRadius: 3,
      }}
    >
      {/* Header */}
      <Stack useFlexGap direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(colorVal, 0.1),
            color: colorVal,
            border: `1px solid ${alpha(colorVal, 0.12)}`,
            flexShrink: 0,
          }}
        >
          <Iconify icon={section.icon} width={26} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {section.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {section.description}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Steps */}
      <Stack spacing={1.5}>
        {section.steps.map((step, i) => (
          <Stack useFlexGap key={i} direction="row" alignItems="flex-start" spacing={1.5}>
            <StepBadge index={i} />
            <Box sx={{ pt: 0.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {step.label}
              </Typography>
              {step.detail && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                  {step.detail}
                </Typography>
              )}
            </Box>
          </Stack>
        ))}
      </Stack>

      {/* Notes */}
      {section.notes && section.notes.length > 0 && (
        <Box
          sx={{
            mt: 2.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(colorVal, 0.06),
            border: `1px solid ${alpha(colorVal, 0.1)}`,
          }}
        >
          {section.notes.map((note, i) => (
            <Stack useFlexGap key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ mb: i < section.notes!.length - 1 ? 1 : 0 }}>
              <Iconify icon="solar:info-circle-bold-duotone" width={16} sx={{ color: colorVal, mt: 0.15, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {note}
              </Typography>
            </Stack>
          ))}
        </Box>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

export function InstructionsView() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const chapters: Chapter[] = [
    // ──────────────── GETTING STARTED ────────────────
    {
      id: 'getting-started',
      label: t('guide.ch_gettingStarted'),
      icon: 'solar:rocket-bold-duotone',
      sections: [
        {
          id: 'overview',
          title: t('guide.gs_overviewTitle'),
          icon: 'solar:home-angle-bold-duotone',
          color: 'primary',
          description: t('guide.gs_overviewDesc'),
          steps: [
            { label: t('guide.gs_s1'), detail: t('guide.gs_s1d') },
            { label: t('guide.gs_s2'), detail: t('guide.gs_s2d') },
            { label: t('guide.gs_s3'), detail: t('guide.gs_s3d') },
            { label: t('guide.gs_s4'), detail: t('guide.gs_s4d') },
          ],
        },
        {
          id: 'first-setup',
          title: t('guide.gs_setupTitle'),
          icon: 'solar:settings-bold-duotone',
          color: 'info',
          description: t('guide.gs_setupDesc'),
          steps: [
            { label: t('guide.gs_setup1'), detail: t('guide.gs_setup1d') },
            { label: t('guide.gs_setup2'), detail: t('guide.gs_setup2d') },
            { label: t('guide.gs_setup3'), detail: t('guide.gs_setup3d') },
            { label: t('guide.gs_setup4'), detail: t('guide.gs_setup4d') },
            { label: t('guide.gs_setup5'), detail: t('guide.gs_setup5d') },
            { label: t('guide.gs_setup6'), detail: t('guide.gs_setup6d') },
          ],
          notes: [
            t('guide.gs_setupN1'),
            t('guide.gs_setupN2'),
          ],
        },
      ],
    },

    // ──────────────── INVENTORY ────────────────
    {
      id: 'inventory',
      label: t('guide.ch_inventory'),
      icon: 'solar:box-bold-duotone',
      sections: [
        {
          id: 'add-product',
          title: t('guide.inv_addTitle'),
          icon: 'solar:add-square-bold-duotone',
          color: 'primary',
          description: t('guide.inv_addDesc'),
          steps: [
            { label: t('guide.inv_add1'), detail: t('guide.inv_add1d') },
            { label: t('guide.inv_add2'), detail: t('guide.inv_add2d') },
            { label: t('guide.inv_add3'), detail: t('guide.inv_add3d') },
            { label: t('guide.inv_add4'), detail: t('guide.inv_add4d') },
            { label: t('guide.inv_add5'), detail: t('guide.inv_add5d') },
            { label: t('guide.inv_add6'), detail: t('guide.inv_add6d') },
            { label: t('guide.inv_add7'), detail: t('guide.inv_add7d') },
            { label: t('guide.inv_add8'), detail: t('guide.inv_add8d') },
            { label: t('guide.inv_add9'), detail: t('guide.inv_add9d') },
            { label: t('guide.inv_add10'), detail: t('guide.inv_add10d') },
          ],
        },
        {
          id: 'restock',
          title: t('guide.inv_restockTitle'),
          icon: 'solar:inbox-in-bold-duotone',
          color: 'success',
          description: t('guide.inv_restockDesc'),
          steps: [
            { label: t('guide.inv_restock1'), detail: t('guide.inv_restock1d') },
            { label: t('guide.inv_restock2'), detail: t('guide.inv_restock2d') },
            { label: t('guide.inv_restock3'), detail: t('guide.inv_restock3d') },
            { label: t('guide.inv_restock4'), detail: t('guide.inv_restock4d') },
            { label: t('guide.inv_restock5'), detail: t('guide.inv_restock5d') },
          ],
          notes: [
            t('guide.inv_restockN1'),
            t('guide.inv_restockN2'),
            t('guide.inv_restockN3'),
            t('guide.inv_restockN4'),
          ],
        },
        {
          id: 'edit-delete-product',
          title: t('guide.inv_editTitle'),
          icon: 'solar:pen-bold-duotone',
          color: 'warning',
          description: t('guide.inv_editDesc'),
          steps: [
            { label: t('guide.inv_edit1'), detail: t('guide.inv_edit1d') },
            { label: t('guide.inv_edit2'), detail: t('guide.inv_edit2d') },
            { label: t('guide.inv_edit3'), detail: t('guide.inv_edit3d') },
            { label: t('guide.inv_edit4'), detail: t('guide.inv_edit4d') },
          ],
          notes: [
            t('guide.inv_editN1'),
          ],
        },
        {
          id: 'low-stock',
          title: t('guide.inv_lowTitle'),
          icon: 'solar:danger-triangle-bold-duotone',
          color: 'error',
          description: t('guide.inv_lowDesc'),
          steps: [
            { label: t('guide.inv_low1'), detail: t('guide.inv_low1d') },
            { label: t('guide.inv_low2'), detail: t('guide.inv_low2d') },
            { label: t('guide.inv_low3'), detail: t('guide.inv_low3d') },
          ],
          notes: [
            t('guide.inv_lowN1'),
          ],
        },
      ],
    },

    // ──────────────── SALES & INVOICING ────────────────
    {
      id: 'sales',
      label: t('guide.ch_sales'),
      icon: 'solar:bill-list-bold-duotone',
      sections: [
        {
          id: 'create-invoice',
          title: t('guide.sales_createTitle'),
          icon: 'solar:document-add-bold-duotone',
          color: 'primary',
          description: t('guide.sales_createDesc'),
          steps: [
            { label: t('guide.sales_create1'), detail: t('guide.sales_create1d') },
            { label: t('guide.sales_create2'), detail: t('guide.sales_create2d') },
            { label: t('guide.sales_create3'), detail: t('guide.sales_create3d') },
            { label: t('guide.sales_create4'), detail: t('guide.sales_create4d') },
            { label: t('guide.sales_create5'), detail: t('guide.sales_create5d') },
            { label: t('guide.sales_create6'), detail: t('guide.sales_create6d') },
            { label: t('guide.sales_create7'), detail: t('guide.sales_create7d') },
          ],
          notes: [
            t('guide.sales_createN1'),
            t('guide.sales_createN2'),
          ],
        },
        {
          id: 'print-invoice',
          title: t('guide.sales_printTitle'),
          icon: 'solar:printer-bold-duotone',
          color: 'info',
          description: t('guide.sales_printDesc'),
          steps: [
            { label: t('guide.sales_print1'), detail: t('guide.sales_print1d') },
            { label: t('guide.sales_print2'), detail: t('guide.sales_print2d') },
            { label: t('guide.sales_print3'), detail: t('guide.sales_print3d') },
          ],
          notes: [
            t('guide.sales_printN1'),
          ],
        },
        {
          id: 'payment-status',
          title: t('guide.sales_payTitle'),
          icon: 'solar:wallet-bold-duotone',
          color: 'warning',
          description: t('guide.sales_payDesc'),
          steps: [
            { label: t('guide.sales_pay1'), detail: t('guide.sales_pay1d') },
            { label: t('guide.sales_pay2'), detail: t('guide.sales_pay2d') },
            { label: t('guide.sales_pay3'), detail: t('guide.sales_pay3d') },
          ],
        },
        {
          id: 'delete-invoice',
          title: t('guide.sales_delTitle'),
          icon: 'solar:trash-bin-trash-bold-duotone',
          color: 'error',
          description: t('guide.sales_delDesc'),
          steps: [
            { label: t('guide.sales_del1'), detail: t('guide.sales_del1d') },
            { label: t('guide.sales_del2'), detail: t('guide.sales_del2d') },
          ],
          notes: [
            t('guide.sales_delN1'),
          ],
        },
        {
          id: 'retail-sales',
          title: t('guide.sales_retailTitle'),
          icon: 'solar:shop-bold-duotone',
          color: 'success',
          description: t('guide.sales_retailDesc'),
          steps: [
            { label: t('guide.sales_retail1'), detail: t('guide.sales_retail1d') },
            { label: t('guide.sales_retail2'), detail: t('guide.sales_retail2d') },
            { label: t('guide.sales_retail3'), detail: t('guide.sales_retail3d') },
            { label: t('guide.sales_retail4'), detail: t('guide.sales_retail4d') },
            { label: t('guide.sales_retail5'), detail: t('guide.sales_retail5d') },
          ],
          notes: [
            t('guide.sales_retailN1'),
            t('guide.sales_retailN2'),
            t('guide.sales_retailN3'),
          ],
        },
      ],
    },

    // ──────────────── CLIENTS ────────────────
    {
      id: 'clients',
      label: t('guide.ch_clients'),
      icon: 'solar:users-group-rounded-bold-duotone',
      sections: [
        {
          id: 'add-client',
          title: t('guide.cl_addTitle'),
          icon: 'solar:user-plus-bold-duotone',
          color: 'primary',
          description: t('guide.cl_addDesc'),
          steps: [
            { label: t('guide.cl_add1'), detail: t('guide.cl_add1d') },
            { label: t('guide.cl_add2'), detail: t('guide.cl_add2d') },
            { label: t('guide.cl_add3'), detail: t('guide.cl_add3d') },
            { label: t('guide.cl_add4'), detail: t('guide.cl_add4d') },
            { label: t('guide.cl_add5'), detail: t('guide.cl_add5d') },
          ],
        },
        {
          id: 'client-history',
          title: t('guide.cl_histTitle'),
          icon: 'solar:history-bold-duotone',
          color: 'info',
          description: t('guide.cl_histDesc'),
          steps: [
            { label: t('guide.cl_hist1'), detail: t('guide.cl_hist1d') },
            { label: t('guide.cl_hist2'), detail: t('guide.cl_hist2d') },
            { label: t('guide.cl_hist3'), detail: t('guide.cl_hist3d') },
          ],
        },
        {
          id: 'edit-delete-client',
          title: t('guide.cl_editTitle'),
          icon: 'solar:pen-bold-duotone',
          color: 'warning',
          description: t('guide.cl_editDesc'),
          steps: [
            { label: t('guide.cl_edit1'), detail: t('guide.cl_edit1d') },
            { label: t('guide.cl_edit2'), detail: t('guide.cl_edit2d') },
            { label: t('guide.cl_edit3'), detail: t('guide.cl_edit3d') },
          ],
        },
      ],
    },

    // ──────────────── SUPPLIERS ────────────────
    {
      id: 'suppliers',
      label: t('guide.ch_suppliers'),
      icon: 'solar:delivery-bold-duotone',
      sections: [
        {
          id: 'add-supplier',
          title: t('guide.sup_addTitle'),
          icon: 'solar:add-square-bold-duotone',
          color: 'warning',
          description: t('guide.sup_addDesc'),
          steps: [
            { label: t('guide.sup_add1'), detail: t('guide.sup_add1d') },
            { label: t('guide.sup_add2'), detail: t('guide.sup_add2d') },
            { label: t('guide.sup_add3'), detail: t('guide.sup_add3d') },
            { label: t('guide.sup_add4'), detail: t('guide.sup_add4d') },
            { label: t('guide.sup_add5'), detail: t('guide.sup_add5d') },
            { label: t('guide.sup_add6'), detail: t('guide.sup_add6d') },
            { label: t('guide.sup_add7'), detail: t('guide.sup_add7d') },
          ],
          notes: [
            t('guide.sup_addN1'),
          ],
        },
        {
          id: 'record-purchase',
          title: t('guide.sup_purchaseTitle'),
          icon: 'solar:cart-bold-duotone',
          color: 'success',
          description: t('guide.sup_purchaseDesc'),
          steps: [
            { label: t('guide.sup_purchase1'), detail: t('guide.sup_purchase1d') },
            { label: t('guide.sup_purchase2'), detail: t('guide.sup_purchase2d') },
            { label: t('guide.sup_purchase3'), detail: t('guide.sup_purchase3d') },
            { label: t('guide.sup_purchase4'), detail: t('guide.sup_purchase4d') },
          ],
          notes: [
            t('guide.sup_purchaseN1'),
          ],
        },
        {
          id: 'supplier-history',
          title: t('guide.sup_histTitle'),
          icon: 'solar:history-bold-duotone',
          color: 'info',
          description: t('guide.sup_histDesc'),
          steps: [
            { label: t('guide.sup_hist1'), detail: t('guide.sup_hist1d') },
            { label: t('guide.sup_hist2'), detail: t('guide.sup_hist2d') },
          ],
        },
      ],
    },

    // ──────────────── EXPENSES ────────────────
    {
      id: 'expenses',
      label: t('guide.ch_expenses'),
      icon: 'solar:wallet-money-bold-duotone',
      sections: [
        {
          id: 'add-expense',
          title: t('guide.exp_addTitle'),
          icon: 'solar:add-square-bold-duotone',
          color: 'error',
          description: t('guide.exp_addDesc'),
          steps: [
            { label: t('guide.exp_add1'), detail: t('guide.exp_add1d') },
            { label: t('guide.exp_add2'), detail: t('guide.exp_add2d') },
            { label: t('guide.exp_add3'), detail: t('guide.exp_add3d') },
            { label: t('guide.exp_add4'), detail: t('guide.exp_add4d') },
            { label: t('guide.exp_add5'), detail: t('guide.exp_add5d') },
            { label: t('guide.exp_add6'), detail: t('guide.exp_add6d') },
          ],
          notes: [
            t('guide.exp_addN1'),
            t('guide.exp_addN2'),
          ],
        },
        {
          id: 'edit-delete-expense',
          title: t('guide.exp_editTitle'),
          icon: 'solar:pen-bold-duotone',
          color: 'warning',
          description: t('guide.exp_editDesc'),
          steps: [
            { label: t('guide.exp_edit1'), detail: t('guide.exp_edit1d') },
            { label: t('guide.exp_edit2'), detail: t('guide.exp_edit2d') },
            { label: t('guide.exp_edit3'), detail: t('guide.exp_edit3d') },
          ],
        },
      ],
    },

    // ──────────────── REPORTS ────────────────
    {
      id: 'reports',
      label: t('guide.ch_reports'),
      icon: 'solar:chart-2-bold-duotone',
      sections: [
        {
          id: 'using-reports',
          title: t('guide.rep_title'),
          icon: 'solar:graph-up-bold-duotone',
          color: 'secondary',
          description: t('guide.rep_desc'),
          steps: [
            { label: t('guide.rep_1'), detail: t('guide.rep_1d') },
            { label: t('guide.rep_2'), detail: t('guide.rep_2d') },
            { label: t('guide.rep_3'), detail: t('guide.rep_3d') },
            { label: t('guide.rep_4'), detail: t('guide.rep_4d') },
            { label: t('guide.rep_5'), detail: t('guide.rep_5d') },
            { label: t('guide.rep_6'), detail: t('guide.rep_6d') },
          ],
          notes: [
            t('guide.rep_N1'),
          ],
        },
      ],
    },

    // ──────────────── SETTINGS ────────────────
    {
      id: 'settings',
      label: t('guide.ch_settings'),
      icon: 'solar:settings-bold-duotone',
      sections: [
        {
          id: 'business-info',
          title: t('guide.set_bizTitle'),
          icon: 'solar:buildings-3-bold-duotone',
          color: 'primary',
          description: t('guide.set_bizDesc'),
          steps: [
            { label: t('guide.set_biz1'), detail: t('guide.set_biz1d') },
            { label: t('guide.set_biz2'), detail: t('guide.set_biz2d') },
            { label: t('guide.set_biz3'), detail: t('guide.set_biz3d') },
            { label: t('guide.set_biz4'), detail: t('guide.set_biz4d') },
            { label: t('guide.set_biz5'), detail: t('guide.set_biz5d') },
          ],
        },
        {
          id: 'invoice-settings',
          title: t('guide.set_invTitle'),
          icon: 'solar:document-text-bold-duotone',
          color: 'info',
          description: t('guide.set_invDesc'),
          steps: [
            { label: t('guide.set_inv1'), detail: t('guide.set_inv1d') },
            { label: t('guide.set_inv2'), detail: t('guide.set_inv2d') },
            { label: t('guide.set_inv3'), detail: t('guide.set_inv3d') },
            { label: t('guide.set_inv4'), detail: t('guide.set_inv4d') },
            { label: t('guide.set_inv5'), detail: t('guide.set_inv5d') },
            { label: t('guide.set_inv6'), detail: t('guide.set_inv6d') },
          ],
        },
        {
          id: 'categories',
          title: t('guide.set_catTitle'),
          icon: 'solar:tag-bold-duotone',
          color: 'warning',
          description: t('guide.set_catDesc'),
          steps: [
            { label: t('guide.set_cat1'), detail: t('guide.set_cat1d') },
            { label: t('guide.set_cat2'), detail: t('guide.set_cat2d') },
            { label: t('guide.set_cat3'), detail: t('guide.set_cat3d') },
            { label: t('guide.set_cat4'), detail: t('guide.set_cat4d') },
          ],
          notes: [
            t('guide.set_catN1'),
            t('guide.set_catN2'),
          ],
        },
        {
          id: 'account',
          title: t('guide.set_accTitle'),
          icon: 'solar:shield-user-bold-duotone',
          color: 'error',
          description: t('guide.set_accDesc'),
          steps: [
            { label: t('guide.set_acc1'), detail: t('guide.set_acc1d') },
            { label: t('guide.set_acc2'), detail: t('guide.set_acc2d') },
            { label: t('guide.set_acc3'), detail: t('guide.set_acc3d') },
            { label: t('guide.set_acc4'), detail: t('guide.set_acc4d') },
            { label: t('guide.set_acc5'), detail: t('guide.set_acc5d') },
            { label: t('guide.set_acc6'), detail: t('guide.set_acc6d') },
          ],
          notes: [
            t('guide.set_accN1'),
          ],
        },
        {
          id: 'preferences',
          title: t('guide.set_prefTitle'),
          icon: 'solar:slider-minimalistic-bold-duotone',
          color: 'secondary',
          description: t('guide.set_prefDesc'),
          steps: [
            { label: t('guide.set_pref1'), detail: t('guide.set_pref1d') },
            { label: t('guide.set_pref2'), detail: t('guide.set_pref2d') },
            { label: t('guide.set_pref3'), detail: t('guide.set_pref3d') },
            { label: t('guide.set_pref4'), detail: t('guide.set_pref4d') },
            { label: t('guide.set_pref5'), detail: t('guide.set_pref5d') },
            { label: t('guide.set_pref6'), detail: t('guide.set_pref6d') },
          ],
        },
        {
          id: 'reset',
          title: t('guide.set_resetTitle'),
          icon: 'solar:restart-bold-duotone',
          color: 'error',
          description: t('guide.set_resetDesc'),
          steps: [
            { label: t('guide.set_reset1'), detail: t('guide.set_reset1d') },
            { label: t('guide.set_reset2'), detail: t('guide.set_reset2d') },
            { label: t('guide.set_reset3'), detail: t('guide.set_reset3d') },
            { label: t('guide.set_reset4'), detail: t('guide.set_reset4d') },
            { label: t('guide.set_reset5'), detail: t('guide.set_reset5d') },
          ],
          notes: [
            t('guide.set_resetN1'),
            t('guide.set_resetN2'),
            t('guide.set_resetN3'),
          ],
        },
      ],
    },

    // ──────────────── DASHBOARD ────────────────
    {
      id: 'dashboard',
      label: t('guide.ch_dashboard'),
      icon: 'solar:home-angle-bold-duotone',
      sections: [
        {
          id: 'kpi-cards',
          title: t('guide.db_kpiTitle'),
          icon: 'solar:chart-square-bold-duotone',
          color: 'info',
          description: t('guide.db_kpiDesc'),
          steps: [
            { label: t('guide.db_kpi1'), detail: t('guide.db_kpi1d') },
            { label: t('guide.db_kpi2'), detail: t('guide.db_kpi2d') },
            { label: t('guide.db_kpi3'), detail: t('guide.db_kpi3d') },
            { label: t('guide.db_kpi4'), detail: t('guide.db_kpi4d') },
          ],
          notes: [
            t('guide.db_kpiN1'),
          ],
        },
        {
          id: 'quick-actions',
          title: t('guide.db_qaTitle'),
          icon: 'solar:widget-bold-duotone',
          color: 'primary',
          description: t('guide.db_qaDesc'),
          steps: [
            { label: t('guide.db_qa1'), detail: t('guide.db_qa1d') },
            { label: t('guide.db_qa2'), detail: t('guide.db_qa2d') },
            { label: t('guide.db_qa3'), detail: t('guide.db_qa3d') },
            { label: t('guide.db_qa4'), detail: t('guide.db_qa4d') },
          ],
        },
        {
          id: 'global-search',
          title: t('guide.db_searchTitle'),
          icon: 'solar:magnifer-bold-duotone',
          color: 'secondary',
          description: t('guide.db_searchDesc'),
          steps: [
            { label: t('guide.db_search1'), detail: t('guide.db_search1d') },
            { label: t('guide.db_search2'), detail: t('guide.db_search2d') },
            { label: t('guide.db_search3'), detail: t('guide.db_search3d') },
            { label: t('guide.db_search4'), detail: t('guide.db_search4d') },
          ],
        },
      ],
    },
  ];

  const chapter = chapters[activeTab];

  return (
    <Box sx={{ px: { xs: 2, md: 5 }, py: 4, maxWidth: 1100, mx: 'auto' }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          <Iconify icon="solar:book-2-bold-duotone" width={32} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t('guide.pageTitle')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('guide.pageSubtitle')}
          </Typography>
        </Box>
      </Stack>

      {/* Chapter tabs */}
      <Box
        sx={{
          mb: 4,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 52,
              fontWeight: 600,
              fontSize: '0.8rem',
              gap: 1,
              flexDirection: 'row',
            },
            '& .MuiTab-iconWrapper': {
              marginRight: 0,
              marginLeft: 0,
            },
          }}
        >
          {chapters.map((ch, i) => (
            <Tab
              key={ch.id}
              label={ch.label}
              icon={<Iconify icon={ch.icon} width={18} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Chapter content */}
      <Box>
        {chapter.sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </Box>

      {/* Footer note */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.info.main, 0.06),
          border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Iconify icon="solar:lock-bold-duotone" width={20} sx={{ color: theme.palette.info.main, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('guide.footerNote')}
        </Typography>
      </Box>

      {/* Support note */}
      <Box
        sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.warning.main, 0.06),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.18)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Iconify icon="solar:bug-bold-duotone" width={20} sx={{ color: theme.palette.warning.main, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('guide.supportNote')}
        </Typography>
      </Box>
    </Box>
  );
}
