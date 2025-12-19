import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Users,
    CreditCard,
    CalendarRange,
    LogOut,
    ChefHat,
    MenuSquare
} from 'lucide-react';

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
        { name: 'Menu', path: '/admin/menu', icon: MenuSquare },
        { name: 'Customers', path: '/admin/customers', icon: Users },
        { name: 'Staff', path: '/admin/staff', icon: ChefHat }, // Changed icon to differentiate
        { name: 'Tables', path: '/admin/tables', icon: UtensilsCrossed },
        { name: 'Payments', path: '/admin/payments', icon: CreditCard },
        { name: 'Schedule', path: '/admin/schedule', icon: CalendarRange },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ChefHat className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        River Side
                    </span>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'}`} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Logged in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">Admin</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Mobile Header (visible only on small screens) */}
                <div className="md:hidden bg-white p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
                    <span className="font-bold text-lg text-primary">River Side Admin</span>
                    <button onClick={handleLogout} className="p-2 text-gray-600">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
