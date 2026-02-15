import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import {
  DollarSign,
  LineChart,
  AlertCircle,
  TrendingUp,
  Truck,
  CheckCircle,
  PieChart,
  ShoppingCart,
} from 'lucide-react';

import {
  _dashboardMetrics,
  _productsSold,
  _recentSales,
  _revenueBreakdown,
  _secondaryMetrics,
  _statsComparison,
  _todoList,
} from 'src/_mock';

import { DashboardContent } from 'src/layouts/dashboard';

import { AnalyticsProductsSold } from '../analytics-products-sold';
import { AnalyticsQuickActions } from '../analytics-quick-actions';
import { AnalyticsRecentSales } from '../analytics-recent-sales';
import { AnalyticsRevenueBreakdown } from '../analytics-revenue-breakdown';
import { AnalyticsStatsComparison } from '../analytics-stats-comparison';
import { AnalyticsTodoList } from '../analytics-todo-list';
import { AnalyticsWidgetSecondary } from '../analytics-widget-secondary';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ======================================================================

export function OverviewAnalyticsView() {
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
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {/* ============ MAIN CARDS ROW ============ */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Today Revenue"
            percent={_dashboardMetrics.todayRevenue.percent}
            total={_dashboardMetrics.todayRevenue.total}
            icon={<DollarSign style={{ width: 40, height: 40 }} />}
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
            icon={<LineChart style={{ width: 40, height: 40 }} />}
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
            icon={<AlertCircle style={{ width: 40, height: 40 }} />}
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
            icon={<TrendingUp style={{ width: 40, height: 40 }} />}
            chart={{
              categories: _dashboardMetrics.todayProfit.chart.categories,
              series: _dashboardMetrics.todayProfit.chart.series,
            }}
          />
        </Grid>

        {/* ============ SECONDARY CARDS ROW ============ */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSecondary
            title="Suppliers Owed"
            percent={_secondaryMetrics.suppliersOwed.percent}
            total={_secondaryMetrics.suppliersOwed.total}
            icon={<Truck style={{ width: 22, height: 22 }} />}
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
            icon={<CheckCircle style={{ width: 22, height: 22 }} />}
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
            icon={<PieChart style={{ width: 22, height: 22 }} />}
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
            icon={<ShoppingCart style={{ width: 22, height: 22 }} />}
            chart={{
              categories: _secondaryMetrics.ordersThisMonth.chart.categories,
              series: _secondaryMetrics.ordersThisMonth.chart.series,
            }}
          />
        </Grid>

        {/* ============ STATS & QUICK ACTIONS ROW ============ */}
        <Grid size={{ xs: 12, md: 8 }}>
          <AnalyticsStatsComparison
            title="This Month vs This Year"
            chart={{
              categories: _statsComparison.categories,
              series: _statsComparison.series,
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

        {/* ============ REVENUE BREAKDOWN & PRODUCTS ROW (UNDER STATS) ============ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsRevenueBreakdown
            title="Revenue by Category"
            chart={{
              series: _revenueBreakdown.series,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsProductsSold
            title="Recent Products"
            list={_productsSold.slice(4, 8)}
          />
        </Grid>

        {/* ============ TODO LIST (UNDER QUICK ACTIONS) ============ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsTodoList title="Todo List" list={_todoList} />
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
