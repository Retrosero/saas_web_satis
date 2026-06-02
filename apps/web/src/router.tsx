import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoadingState } from '@/components/data/LoadingState';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TenantsPage = lazy(() => import('@/pages/super-admin/TenantsPage').then((m) => ({ default: m.TenantsPage })));
const TenantDetailPage = lazy(() => import('@/pages/super-admin/TenantDetailPage').then((m) => ({ default: m.TenantDetailPage })));
const SuperAdminDashboardPage = lazy(() => import('@/pages/super-admin/SuperAdminDashboardPage').then((m) => ({ default: m.SuperAdminDashboardPage })));
const SuperAdminLogsPage = lazy(() => import('@/pages/super-admin/SuperAdminLogsPage').then((m) => ({ default: m.SuperAdminLogsPage })));
const PlansPage = lazy(() => import('@/pages/super-admin/PlansPage').then((m) => ({ default: m.PlansPage })));
const ModulesPage = lazy(() => import('@/pages/super-admin/ModulesPage').then((m) => ({ default: m.ModulesPage })));
const UsersPage = lazy(() => import('@/pages/super-admin/UsersPage').then((m) => ({ default: m.UsersPage })));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SettingsOverviewPage = lazy(() => import('@/pages/settings/SettingsOverviewPage').then((m) => ({ default: m.SettingsOverviewPage })));
const SettingsSubscriptionPage = lazy(() => import('@/pages/settings/SettingsSubscriptionPage').then((m) => ({ default: m.SettingsSubscriptionPage })));
const SettingsModulesPage = lazy(() => import('@/pages/settings/SettingsModulesPage').then((m) => ({ default: m.SettingsModulesPage })));
const SettingsUsersPage = lazy(() => import('@/pages/settings/SettingsUsersPage').then((m) => ({ default: m.SettingsUsersPage })));
const SettingsRolesPage = lazy(() => import('@/pages/settings/SettingsRolesPage').then((m) => ({ default: m.SettingsRolesPage })));
const SettingsLogsPage = lazy(() => import('@/pages/settings/SettingsLogsPage').then((m) => ({ default: m.SettingsLogsPage })));
const SettingsLayout = lazy(() => import('@/layouts/SettingsLayout').then((m) => ({ default: m.SettingsLayout })));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));

// FAZ 6 — Cari Modülü
const CustomerListPage = lazy(() => import('@/pages/customers/CustomerListPage').then((m) => ({ default: m.CustomerListPage })));
const CustomerNewPage = lazy(() => import('@/pages/customers/CustomerNewPage').then((m) => ({ default: m.CustomerNewPage })));
const CustomerDetailPage = lazy(() => import('@/pages/customers/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })));

// FAZ 7 — Stok Modülü
const ProductListPage = lazy(() => import('@/pages/products/ProductListPage').then((m) => ({ default: m.ProductListPage })));
const ProductNewPage = lazy(() => import('@/pages/products/ProductNewPage').then((m) => ({ default: m.ProductNewPage })));
const ProductDetailPage = lazy(() => import('@/pages/products/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const WarehouseListPage = lazy(() => import('@/pages/warehouses/WarehouseListPage').then((m) => ({ default: m.WarehouseListPage })));
const StockMovementsPage = lazy(() => import('@/pages/stock/StockMovementsPage').then((m) => ({ default: m.StockMovementsPage })));

// FAZ 8 — Satış Modülü
const SaleListPage = lazy(() => import('@/pages/sales/SaleListPage').then((m) => ({ default: m.SaleListPage })));
const SaleNewPage = lazy(() => import('@/pages/sales/saleNewPage').then((m) => ({ default: m.SaleNewPage })));
const SaleDetailPage = lazy(() => import('@/pages/sales/SaleDetailPage').then((m) => ({ default: m.SaleDetailPage })));

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<LoadingState size="lg" />}>{node}</Suspense>;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="card p-8 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-on-surface-variant mt-2">Bu modül ilerideki fazlarda eklenecek.</p>
    </div>
  );
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <AuthLayout>
        {withSuspense(<LoginPage />)}
      </AuthLayout>
    ),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      // Süper Admin
      { path: 'super-admin/dashboard', element: withSuspense(<SuperAdminDashboardPage />) },
      { path: 'super-admin/tenants', element: withSuspense(<TenantsPage />) },
      { path: 'super-admin/tenants/:id', element: withSuspense(<TenantDetailPage />) },
      { path: 'super-admin/users', element: withSuspense(<UsersPage />) },
      { path: 'super-admin/plans', element: withSuspense(<PlansPage />) },
      { path: 'super-admin/modules', element: withSuspense(<ModulesPage />) },
      { path: 'super-admin/logs', element: withSuspense(<SuperAdminLogsPage />) },
      // Operasyonel modüller (FAZ 6+)
      { path: 'customers', element: withSuspense(<CustomerListPage />) },
      { path: 'customers/new', element: withSuspense(<CustomerNewPage />) },
      { path: 'customers/:id', element: withSuspense(<CustomerDetailPage />) },
      { path: 'products', element: withSuspense(<ProductListPage />) },
      { path: 'products/new', element: withSuspense(<ProductNewPage />) },
      { path: 'products/:id', element: withSuspense(<ProductDetailPage />) },
      { path: 'warehouses', element: withSuspense(<WarehouseListPage />) },
      { path: 'stock/movements', element: withSuspense(<StockMovementsPage />) },
      // FAZ 8 — Satış Modülü
      { path: 'sales', element: withSuspense(<SaleListPage />) },
      { path: 'sales/new', element: withSuspense(<SaleNewPage />) },
      { path: 'sales/:id', element: withSuspense(<SaleDetailPage />) },
      { path: 'orders', element: <ComingSoon title="Siparişler" /> },
      { path: 'collections', element: <ComingSoon title="Tahsilat" /> },
      { path: 'cash', element: <ComingSoon title="Kasa" /> },
      { path: 'reports', element: <ComingSoon title="Raporlar" /> },
      { path: 'notifications', element: withSuspense(<NotificationsPage />) },
      // Ayarlar (SettingsLayout altında)
      {
        path: 'settings',
        element: withSuspense(<SettingsLayout />),
        children: [
          { index: true, element: withSuspense(<SettingsOverviewPage />) },
          { path: 'subscription', element: withSuspense(<SettingsSubscriptionPage />) },
          { path: 'modules', element: withSuspense(<SettingsModulesPage />) },
          { path: 'users', element: withSuspense(<SettingsUsersPage />) },
          { path: 'roles', element: withSuspense(<SettingsRolesPage />) },
          { path: 'logs', element: withSuspense(<SettingsLogsPage />) },
        ],
      },
      { path: '403', element: withSuspense(<ForbiddenPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
];

export const router = createBrowserRouter(routes);
