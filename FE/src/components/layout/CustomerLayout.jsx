import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, History, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function CustomerLayout() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const location = useLocation();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link to="/menu" className="flex items-center gap-2">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <UtensilsCrossed className="w-6 h-6" />
                                </div>
                                <span className="text-xl font-bold text-gray-800 tracking-tight">River Side</span>
                            </Link>

                            <div className="hidden md:flex items-center gap-1">
                                <NavLink to="/menu" current={location.pathname}>Menu</NavLink>
                                <NavLink to="/tables" current={location.pathname}>Tables</NavLink>
                                <NavLink to="/orders" current={location.pathname}>My Orders</NavLink>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary transition-colors">
                                <ShoppingBag className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            <div className="h-6 w-px bg-gray-200 mx-2"></div>

                            {user ? (
                                <div className="flex items-center gap-3">
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                                        <p className="text-xs text-secondary capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="text-sm font-bold text-primary hover:underline">
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Mobile Nav Bottom */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50 pb-safe">
                <MobileNavLink to="/menu" icon={UtensilsCrossed} label="Menu" current={location.pathname} />
                <MobileNavLink to="/tables" icon={UtensilsCrossed} label="Tables" current={location.pathname} />
                <MobileNavLink to="/cart" icon={ShoppingBag} label="Cart" current={location.pathname} count={cartCount} />
                <MobileNavLink to="/orders" icon={History} label="Orders" current={location.pathname} />
                <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 text-gray-400">
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}

function NavLink({ to, children, current }) {
    const active = current === to;
    return (
        <Link
            to={to}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            {children}
        </Link>
    )
}

// eslint-disable-next-line no-unused-vars
function MobileNavLink({ to, icon: IconComponent, label, current, count }) {
    const active = current === to;
    return (
        <Link to={to} className={`flex flex-col items-center justify-center gap-1 relative ${active ? 'text-primary' : 'text-gray-400'}`}>
            <div className="relative">
                <IconComponent className="w-6 h-6" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {count}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    )
}
