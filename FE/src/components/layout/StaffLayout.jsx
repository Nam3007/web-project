import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    ChefHat,
    UtensilsCrossed,
    ClipboardList,
    CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StaffLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    // Define navigation items based on role
    const getNavItems = () => {
        const items = [
            { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
            { name: 'Schedule', path: '/staff/schedule', icon: CalendarDays }, // Added Schedule for all
        ];

        if (user?.role === 'chef') {
            // Chef specific
        } else if (user?.role === 'waiter') {
            items.push({ name: 'Tables', path: '/staff/tables', icon: UtensilsCrossed });
            items.push({ name: 'Active Orders', path: '/staff/orders', icon: ClipboardList });
        }

        return items;
    };

    const navItems = getNavItems();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                        <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">River Side</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Staff Portal</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-500">Logged in as</p>
                        <p className="font-bold text-gray-800 capitalize">{user?.role || 'Staff'}</p>
                        <p className="text-xs text-secondary mt-0.5">{user?.username}</p>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all w-full font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
