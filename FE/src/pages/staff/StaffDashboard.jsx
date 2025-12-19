import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChefDashboard from './ChefDashboard';

export default function StaffDashboard() {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;

    if (user.role === 'chef') {
        return <ChefDashboard />;
    }

    if (user.role === 'waiter') {
        return <Navigate to="/staff/tables" />;
    }

    // Fallback
    return (
        <div className="text-center p-10">
            <h1 className="text-2xl font-bold">Staff Dashboard</h1>
            <p>Welcome, staff member.</p>
        </div>
    );
}
