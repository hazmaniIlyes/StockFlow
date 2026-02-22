import { useState } from 'react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import {
  _cashFlowData,
  _dashboardMetrics,
  _expensesBreakdown,
  _lowStockAlerts,
  _recentSales,
  _secondaryMetrics,
  _todoList,
} from 'src/_mock';

import { Iconify } from 'src/components/iconify';

import { DashboardContent } from 'src/layouts/dashboard';

import { AnalyticsLowStock } from '../analytics-low-stock';
import { AnalyticsQuickActions } from '../analytics-quick-actions';
import { AnalyticsRecentSales } from '../analytics-recent-sales';
import { AnalyticsRevenueBreakdown } from '../analytics-revenue-breakdown';
import { AnalyticsCashFlow } from '../analytics-cash-flow';
import { AnalyticsTodoList } from '../analytics-todo-list';
import { AnalyticsWidgetSecondary } from '../analytics-widget-secondary';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ======================================================================

export function OverviewAnalyticsView() {
  const [showSecondary, setShowSecondary] = useState(true);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleAddProduct = () => {
    console.log('Add Product clicked');
  };

  const handleAddSale = () => {
    console.log('Add Sale/Invoice clicked');
  };

  const handleAddSupplier = () => {
    console.log('Add Supplier clicked');
  };

  const handleViewReports = () => {
    console.log('View Reports clicked');
  };

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        {formattedDate}
      </Typography>

      <Grid container spacing={3}>
        {/* ============ MAIN CARDS ROW ============ */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Today Revenue"
            percent={_dashboardMetrics.todayRevenue.percent}
            total={_dashboardMetrics.todayRevenue.total}
            icon={<Iconify icon="solar:dollar-minimalistic-bold-duotone" width={40} />}
            chart={{
              categories: _dashboardMetrics.todayRevenue.chart.categories,
              series: _dashboardMetrics.todayRevenue.chart.series,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="This Month Revenue"
            percent={_dashboardMetrics.thisMonthRevenue.percent}
            total={_dashboardMetrics.thisMonthRevenue.total}
            icon={<Iconify icon="solar:graph-up-bold-duotone" width={40} />}
            chart={{
              categories: _dashboardMetrics.thisMonthRevenue.chart.categories,
              series: _dashboardMetrics.thisMonthRevenue.chart.series,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Pending Payments"
            percent={_dashboardMetrics.pendingPayments.percent}
            total={_dashboardMetrics.pendingPayments.total}
            icon={<Iconify icon="solar:danger-triangle-bold-duotone" width={40} />}
            chart={{
              categories: _dashboardMetrics.pendingPayments.chart.categories,
              series: _dashboardMetrics.pendingPayments.chart.series,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Today Profit"
            percent={_dashboardMetrics.todayProfit.percent}
            total={_dashboardMetrics.todayProfit.total}
            icon={<Iconify icon="solar:graph-new-up-bold-duotone" width={40} />}
            chart={{
              categories: _dashboardMetrics.todayProfit.chart.categories,
              series: _dashboardMetrics.todayProfit.chart.series,
            }}
          />
        </Grid>

        {/* ============ COLLAPSIBLE SECONDARY CARDS ============ */}
        <Grid size={{ xs: 12 }}>
          <ButtonBase
            onClick={() => setShowSecondary(!showSecondary)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              py: 0.5,
              px: 1,
              borderRadius: 1,
              typography: 'subtitle2',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <Iconify
              icon="solar:alt-arrow-down-bold"
              width={18}
              sx={{
                transition: 'transform 0.2s',
                transform: showSecondary ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            />
            {showSecondary ? 'Hide details' : 'Show details'}
          </ButtonBase>

          <Collapse in={showSecondary}>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSecondary
                  title="Suppliers Owed"
                  percent={_secondaryMetrics.suppliersOwed.percent}
                  total={_secondaryMetrics.suppliersOwed.total}
                  icon={<Iconify icon="solar:delivery-bold-duotone" width={22} />}
                  chart={{
                    categories: _secondaryMetrics.suppliersOwed.chart.categories,
                    series: _secondaryMetrics.suppliersOwed.chart.series,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSecondary
                  title="TVA Collected"
                  percent={_secondaryMetrics.tvaCollected.percent}
                  total={_secondaryMetrics.tvaCollected.total}
                  color="success"
                  icon={<Iconify icon="solar:check-circle-bold-duotone" width={22} />}
                  chart={{
                    categories: _secondaryMetrics.tvaCollected.chart.categories,
                    series: _secondaryMetrics.tvaCollected.chart.series,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSecondary
                  title="Last Month Revenue"
                  percent={_secondaryMetrics.lastMonthRevenue.percent}
                  total={_secondaryMetrics.lastMonthRevenue.total}
                  color="info"
                  icon={<Iconify icon="solar:pie-chart-2-bold-duotone" width={22} />}
                  chart={{
                    categories: _secondaryMetrics.lastMonthRevenue.chart.categories,
                    series: _secondaryMetrics.lastMonthRevenue.chart.series,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSecondary
                  title="Orders This Month"
                  percent={_secondaryMetrics.ordersThisMonth.percent}
                  total={_secondaryMetrics.ordersThisMonth.total}
                  color="warning"
                  icon={<Iconify icon="solar:cart-3-bold-duotone" width={22} />}
                  chart={{
                    categories: _secondaryMetrics.ordersThisMonth.chart.categories,
                    series: _secondaryMetrics.ordersThisMonth.chart.series,
                  }}
                />
              </Grid>
            </Grid>
          </Collapse>
        </Grid>

        {/* ============ STATS & QUICK ACTIONS ROW ============ */}
        <Grid size={{ xs: 12, md: 8 }}>
          <AnalyticsCashFlow
            title="Cash Flow"
            subheader="Last 6 months"
            chart={{
              categories: _cashFlowData.categories,
              moneyIn: _cashFlowData.moneyIn,
              moneyOut: _cashFlowData.moneyOut,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsQuickActions
            onAddProduct={handleAddProduct}
            onAddSale={handleAddSale}
            onAddSupplier={handleAddSupplier}
            onViewReports={handleViewReports}
          />
        </Grid>

        {/* ============ REVENUE BREAKDOWN & LOW STOCK & ACTION ITEMS ============ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsRevenueBreakdown
            title="Expenses Breakdown"
            chart={{
              series: _expensesBreakdown.series,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsLowStock
            title="Low Stock Alerts"
            list={_lowStockAlerts}
          />
        </Grid>

        {/* ============ ACTION ITEMS ============ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsTodoList title="Action Items" list={_todoList} />
        </Grid>

        {/* ============ RECENT SALES ROW ============ */}
        <Grid size={{ xs: 12 }}>
          <AnalyticsRecentSales 
            title="Recent Sales" 
            list={_recentSales as Array<{ id: string; orderNumber: string; customer: string; amount: number; date: string; status: 'completed' | 'pending' | 'shipped' }>}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
