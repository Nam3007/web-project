import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LoginPage from './pages/common/LoginPage';
import CustomerRegisterPage from './pages/common/CustomerRegisterPage';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/manager/AdminDashboard';
import AdminOrdersPage from './pages/manager/AdminOrdersPage';
import AdminMenuPage from './pages/manager/AdminMenuPage';
import AdminStaffPage from './pages/manager/AdminStaffPage';
import AdminSchedulePage from './pages/manager/AdminSchedulePage';
import AdminTablePage from './pages/manager/AdminTablePage';
import AdminPaymentPage from './pages/manager/AdminPaymentPage';
import AdminCustomerPage from './pages/manager/AdminCustomerPage';
import AdminCreateStaffPage from './pages/manager/AdminCreateStaffPage';
import AdminReviewsPage from './pages/manager/AdminReviewsPage';
import AdminOrderConfirmPage from './pages/manager/AdminOrderConfirmPage';
import AdminDiscountCouponPage from './pages/manager/AdminDiscountCouponPage';
import AdminReservationPage from './pages/manager/AdminReservationPage';


// Staff Pages
import StaffLayout from './components/layout/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import WaiterTableSelection from './pages/staff/WaiterTableSelection';
import WaiterOrderEntry from './pages/staff/WaiterOrderEntry';
import WaiterActiveOrdersPage from './pages/staff/WaiterActiveOrdersPage';
import StaffSchedulePage from './pages/staff/StaffSchedulePage';
import DeliveryManDashboard from './pages/staff/DeliveryManDashboard';
import StaffReservationPage from './pages/staff/StaffReservationPage';

// Customer Pages
import CustomerLayout from './components/layout/CustomerLayout';
import CustomerMenuPage from './pages/customer/CustomerMenuPage';
import CustomerCartPage from './pages/customer/CustomerCartPage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerTablePage from './pages/customer/CustomerTablePage';
import CustomerActiveOrderPage from './pages/customer/CustomerActiveOrderPage';
import QRPaymentPage from './pages/customer/QRPaymentPage';
import CustomerReservationPage from './pages/customer/CustomerReservationPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<CustomerRegisterPage />} />
              <Route path="/" element={<Navigate to="/menu" replace />} />

              {/* Customer Routes (Public/Protected mixed) */}
              <Route element={<CustomerLayout />}>
                <Route path="/menu" element={<CustomerMenuPage />} />
                <Route path="/reservations" element={<CustomerReservationPage />} />
                <Route path="/profile" element={<CustomerProfilePage />} />
                <Route path="/coupons" element={<Navigate to="/profile" replace />} />
                <Route path="/tables" element={<CustomerTablePage />} />
                <Route path="/cart" element={<CustomerCartPage />} />
                <Route path="/orders" element={<CustomerOrdersPage />} />
                <Route path="/active-orders" element={<CustomerActiveOrderPage />} />
                <Route path="/qr-payment" element={<QRPaymentPage />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff" element={<StaffLayout />}>
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="reservations" element={<StaffReservationPage />} />
                <Route path="tables" element={<WaiterTableSelection />} />
                <Route path="orders/new" element={<WaiterOrderEntry />} />
                <Route path="orders" element={<WaiterActiveOrdersPage />} />
                <Route path="schedule" element={<StaffSchedulePage />} />
                <Route path="delivery" element={<DeliveryManDashboard />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/manager" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="reservations" element={<AdminReservationPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="menu" element={<AdminMenuPage />} />
                <Route path="staff" element={<AdminStaffPage />} />
                <Route path="staff/create" element={<AdminCreateStaffPage />} />
                <Route path="tables" element={<AdminTablePage />} />
                <Route path="payments" element={<AdminPaymentPage />} />
                <Route path="customers" element={<AdminCustomerPage />} />
                <Route path="schedule" element={<AdminSchedulePage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="coupons" element={<AdminDiscountCouponPage />} />
                <Route path="shipping-confirm" element={<AdminOrderConfirmPage />} />
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
