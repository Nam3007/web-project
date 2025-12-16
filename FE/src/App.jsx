import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/common/LoginPage';

// Placeholder components for redirection targets (will be implemented later)
const MenuPage = () => <div className="p-10 text-xl text-center">Menu Page (Customer) - Under Construction</div>;
const StaffDashboard = () => <div className="p-10 text-xl text-center">Staff Dashboard - Under Construction</div>;
const AdminDashboard = () => <div className="p-10 text-xl text-center">Admin Dashboard - Under Construction</div>;

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Temporary placeholder routes to verify redirect */}
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
