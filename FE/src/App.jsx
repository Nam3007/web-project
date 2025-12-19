import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LoginPage from './pages/common/LoginPage';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminSchedulePage from './pages/admin/AdminSchedulePage';
import AdminTablePage from './pages/admin/AdminTablePage';
import AdminPaymentPage from './pages/admin/AdminPaymentPage';
import AdminCustomerPage from './pages/admin/AdminCustomerPage';

// Staff Pages
import StaffLayout from './components/layout/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import WaiterTableSelection from './pages/staff/WaiterTableSelection';
import WaiterOrderEntry from './pages/staff/WaiterOrderEntry';
import WaiterActiveOrdersPage from './pages/staff/WaiterActiveOrdersPage';
import StaffSchedulePage from './pages/staff/StaffSchedulePage';

// Customer Pages
import CustomerLayout from './components/layout/CustomerLayout';
import CustomerMenuPage from './pages/customer/CustomerMenuPage';
import CustomerCartPage from './pages/customer/CustomerCartPage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerTablePage from './pages/customer/CustomerTablePage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/menu" replace />} />

              {/* Customer Routes (Public/Protected mixed) */}
              <Route element={<CustomerLayout />}>
                <Route path="/menu" element={<CustomerMenuPage />} />
                <Route path="/tables" element={<CustomerTablePage />} />
                <Route path="/cart" element={<CustomerCartPage />} />
                <Route path="/orders" element={<CustomerOrdersPage />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff" element={<StaffLayout />}>
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="tables" element={<WaiterTableSelection />} />
                <Route path="orders/new" element={<WaiterOrderEntry />} />
                <Route path="orders" element={<WaiterActiveOrdersPage />} />
                <Route path="schedule" element={<StaffSchedulePage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="menu" element={<AdminMenuPage />} />
                <Route path="staff" element={<AdminStaffPage />} />
                <Route path="tables" element={<AdminTablePage />} />
                <Route path="payments" element={<AdminPaymentPage />} />
                <Route path="customers" element={<AdminCustomerPage />} />
                <Route path="schedule" element={<AdminSchedulePage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
